import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import Otp from "../models/otp.model.js";
import createToken from "../utils/createToken.js";
import { getOtpPepper } from "../config/secrets.js";
import { getErrorMessage } from "../utils/error/getErrorMessage.js";
import {
  BadRequest,
  Forbidden,
  InternalServerError,
} from "../utils/error/httpErrors.js";
import { EmailService } from "./email.service.js";
import {
  OTP_MAX_ATTEMPTS,
  OTP_REQUEST_PUBLIC_MESSAGE,
  OTP_TTL_MS,
  INVALID_OTP_MESSAGE,
  EMAIL_NOT_VERIFIED_MESSAGE,
  checkOtp,
  generateOtpCode,
  hashOtp,
  resolveLogin,
  resolveOtpEmailAction,
  type OtpPurpose,
} from "../utils/otp.js";
import type {
  ForgotPasswordBody,
  LoginBody,
  RegisterBody,
  RequestOtpBody,
  ResetPasswordBody,
  VerifyOtpBody,
} from "../validations/auth.schema.js";

const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const publicUser = (user: {
  _id: unknown;
  username: string;
  email: string;
  role: string;
  isVerified: boolean;
}) => ({
  _id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  isVerified: user.isVerified,
});

export class AuthService {
  static async register(input: RegisterBody) {
    const { username, email, password } = input;

    const userExists = await User.findOne({ email });
    if (userExists) throw BadRequest("User already exists");

    const hashedPassword = await hashPassword(password);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      isVerified: false,
    });

    await newUser.save();

    try {
      await this.issueOtp({
        email,
        purpose: "verify_email",
        send: (code) =>
          EmailService.sendVerificationEmail(email, username, code),
      });
    } catch (error) {
      console.error("[auth.register] verification email failed:", getErrorMessage(error));
      throw InternalServerError(
        "Unable to send verification email. You can request a new OTP."
      );
    }

    return publicUser(newUser);
  }

  /** Admin-style create (exported from auth controller; not currently routed). */
  static async createUser(input: RegisterBody) {
    const { username, email, password } = input;

    const userExists = await User.findOne({ email });
    if (userExists) throw BadRequest("User already exists");

    const hashedPassword = await hashPassword(password);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      isVerified: false,
    });

    await newUser.save();

    return publicUser(newUser);
  }

  static async login(input: LoginBody) {
    const { email, password } = input;

    const existingUser = await User.findOne({ email }).select("+password");
    const passwordValid = existingUser
      ? await bcrypt.compare(password, existingUser.password)
      : await bcrypt.compare(password, DUMMY_PASSWORD_HASH);

    const outcome = resolveLogin({
      userFound: Boolean(existingUser),
      passwordValid,
      isVerified: Boolean(existingUser?.isVerified),
    });

    if (outcome === "invalid_credentials") {
      throw BadRequest("Invalid email or password");
    }

    if (outcome === "unverified") {
      throw Forbidden(EMAIL_NOT_VERIFIED_MESSAGE);
    }

    const accessToken = createToken((existingUser!._id as string).toString());

    return {
      ...publicUser(existingUser!),
      accessToken,
    };
  }

  static async forgotPassword(input: ForgotPasswordBody) {
    const { email } = input;
    const user = await User.findOne({ email });
    const latest = await Otp.findOne({
      email,
      purpose: "reset_password",
    }).sort({ createdAt: -1 });

    const action = resolveOtpEmailAction({
      userFound: Boolean(user),
      purpose: "reset_password",
      lastSentAt: latest?.lastSentAt,
    });

    if (action === "issue" && user) {
      try {
        const resetBase = process.env.FRONTEND_URL || "";
        await this.issueOtp({
          email,
          purpose: "reset_password",
          send: (code) => {
            const resetUrl = `${resetBase}/reset-password?token=${code}`;
            return EmailService.sendForgotPasswordEmail(
              email,
              user.username,
              resetUrl
            );
          },
        });
      } catch (error) {
        console.error(
          "[auth.forgot-password] email failed:",
          getErrorMessage(error)
        );
      }
    } else if (!user) {
      console.warn("[auth.forgot-password] skipped (no account)");
    } else {
      console.warn("[auth.forgot-password] skipped (cooldown)");
    }

    return { publicMessage: OTP_REQUEST_PUBLIC_MESSAGE };
  }

  static async resetPassword(input: ResetPasswordBody) {
    const { email, code, newPassword } = input;

    await this.consumeValidOtp(email, code, "reset_password");

    const user = await User.findOne({ email });
    if (!user) {
      throw BadRequest(INVALID_OTP_MESSAGE);
    }

    user.password = await hashPassword(newPassword);
    await user.save();

    await Otp.deleteMany({ email, purpose: "reset_password" });

    return {};
  }

  static async requestOtp(input: RequestOtpBody) {
    const { email } = input;
    const user = await User.findOne({ email });
    const latest = await Otp.findOne({
      email,
      purpose: "verify_email",
    }).sort({ createdAt: -1 });

    const action = resolveOtpEmailAction({
      userFound: Boolean(user),
      purpose: "verify_email",
      isVerified: user?.isVerified,
      lastSentAt: latest?.lastSentAt,
    });

    if (action === "issue" && user) {
      try {
        await this.issueOtp({
          email,
          purpose: "verify_email",
          send: (code) =>
            EmailService.sendVerificationEmail(email, user.username, code),
        });
      } catch (error) {
        console.error("[auth.request-otp] email failed:", getErrorMessage(error));
      }
    } else if (!user) {
      console.warn("[auth.request-otp] skipped (no account)");
    } else if (user.isVerified) {
      console.warn("[auth.request-otp] skipped (already verified)");
    } else {
      console.warn("[auth.request-otp] skipped (cooldown)");
    }

    return { publicMessage: OTP_REQUEST_PUBLIC_MESSAGE };
  }

  static async verifyOtp(input: VerifyOtpBody) {
    const { email, code } = input;

    await this.consumeValidOtp(email, code, "verify_email");

    const user = await User.findOne({ email });
    if (!user) {
      throw BadRequest(INVALID_OTP_MESSAGE);
    }

    user.isVerified = true;
    await user.save();

    const accessToken = createToken((user._id as string).toString());

    return {
      ...publicUser(user),
      accessToken,
    };
  }

  private static async issueOtp(params: {
    email: string;
    purpose: OtpPurpose;
    send: (code: string) => Promise<unknown>;
  }) {
    const pepper = getOtpPepper();
    const code = generateOtpCode();
    const codeHash = hashOtp(code, pepper);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await Otp.deleteMany({ email: params.email, purpose: params.purpose });

    const doc = await Otp.create({
      email: params.email,
      purpose: params.purpose,
      codeHash,
      expiresAt,
      attempts: 0,
    });

    try {
      await params.send(code);
      doc.lastSentAt = new Date();
      await doc.save();
    } catch (error) {
      await Otp.deleteOne({ _id: doc._id });
      throw error;
    }
  }

  private static async consumeValidOtp(
    email: string,
    code: string,
    purpose: OtpPurpose
  ) {
    const pepper = getOtpPepper();
    const record = await Otp.findOne({
      email,
      purpose,
    }).sort({ createdAt: -1 });

    const result = checkOtp(record, code, pepper);

    if (!result.ok) {
      if (record && result.reason === "mismatch") {
        const updated = await Otp.findOneAndUpdate(
          { _id: record._id },
          { $inc: { attempts: 1 } },
          { new: true }
        );
        if (updated && updated.attempts >= OTP_MAX_ATTEMPTS) {
          await Otp.deleteOne({ _id: record._id });
        }
      } else if (
        record &&
        (result.reason === "expired" || result.reason === "locked")
      ) {
        await Otp.deleteOne({ _id: record._id });
      }

      throw BadRequest(INVALID_OTP_MESSAGE);
    }

    const claimed = await Otp.findOneAndDelete({
      _id: record!._id,
    });

    if (!claimed) {
      throw BadRequest(INVALID_OTP_MESSAGE);
    }
  }
}

/** bcrypt compare target when no user exists (timing padding only). */
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
  "not-a-real-password-for-timing-only",
  10
);
