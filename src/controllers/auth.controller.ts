import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import createToken from "../utils/createToken.js";
import asyncHandler from "../middlewares/async-handler.middleware.js";
import Otp from "../models/otp.model.js";
import sendEmail, { sendForgotPasswordEmail, sendVerificationEmail } from "../utils/email/sendEmail.js";
import crypto from "crypto";
import { BadRequest, NotFound } from "../utils/error/httpErrors.js";
import { successResponse, createdResponse } from "../utils/apiResponse.js";
import { NotificationService } from "../services/notification.service.js";
import DeviceToken from "../models/device-token.model.js";

// Register user
const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body || {};

  if (!username || !email || !password) {
    throw BadRequest("Please fill all the inputs.");
  }

  const userExists = await User.findOne({ email });
  if (userExists) throw BadRequest("User already exists");

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = new User({
    username,
    email,
    password: hashedPassword,
    // isVerified: false,
  });

  await newUser.save();

  const otpCode = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await Otp.create({ email, code: otpCode, expiresAt });
  // await sendEmail(email, `Hello user, your verification code is: ${otpCode}`);
  await sendVerificationEmail(email, username, otpCode);

  const accessToken = createToken((newUser._id as string).toString())

  createdResponse(res, {
    _id: newUser._id,
    username: newUser.username,
    email: newUser.email,
    role: newUser.role,
    isVerified: newUser?.isVerified,
    accessToken
  }, "OTP sent to email for verification");
});

// Admin create user
const createUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    throw BadRequest("Please fill all the inputs.");
  }

  const userExists = await User.findOne({ email });
  if (userExists) throw BadRequest("User already exists");

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = new User({ 
    username, 
    email, 
    password: hashedPassword 
  });

  await newUser.save();
  const accessToken = createToken((newUser._id as string).toString())

  createdResponse(res, {
    _id: newUser._id,
    username: newUser.username,
    email: newUser.email,
    role: newUser.role,
    accessToken
  }, "User created successfully");
});

// Login
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw BadRequest("Please fill all the inputs.");
  }

  const existingUser = await User.findOne({ email });
  if (!existingUser) throw BadRequest("Invalid email or password");

  const isPasswordValid = await bcrypt.compare(password, existingUser.password);
  if (!isPasswordValid) throw BadRequest("Invalid email or password");

  const accessToken = createToken((existingUser._id as string).toString())

  // const tokens = await DeviceToken.find({userId});
  // if (!tokens.length) {
  //   throw BadRequest('User or FCM token not found');
  // }

  await NotificationService.sendToUser(existingUser._id as string, {
    title: 'Login Notification',
    body: 'This is a test notification from your Express server!',
    icon: "https://res.cloudinary.com/dnkhxafkz/image/upload/v1730950976/jcqwmzekkoejemeypfwc.png",
    badge: "https://res.cloudinary.com/dnkhxafkz/image/upload/v1730950976/jcqwmzekkoejemeypfwc.png"
  });

  successResponse(res, {
    _id: existingUser._id,
    username: existingUser.username,
    email: existingUser.email,
    role: existingUser.role,
    accessToken,
    isVerified: existingUser.isVerified,
  }, "Login successful");
});

// Forgot Password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) throw BadRequest("Email is required");

  const user = await User.findOne({ email });
  if (!user) throw NotFound("User not found.");

  const otpCode = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await Otp.deleteMany({ email });

  await Otp.create({ 
    email,
    code: otpCode,
    expiresAt
  });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${otpCode}`;

  await sendForgotPasswordEmail(email, user.username, resetUrl);
  successResponse(res, {}, "Password reset OTP sent to email");
});

// Reset Password
const resetPassword = asyncHandler(async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    throw BadRequest("Email, OTP and new password are required");
  }

  // Verify OTP
  const otpRecord = await Otp.findOne({ 
    email,
    code,
    // Check expiry
    expiresAt: { $gt: new Date() }
  });

  if (!otpRecord) throw BadRequest("Invalid or expired OTP");

  const user = await User.findOne({ email });
  if (!user) throw NotFound("User not found");

  // Update password
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();

  // Clean up
  await otpRecord.deleteOne();

  successResponse(res, {}, "Password updated successfully");
});

// Request OTP for email verification
const requestOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) throw BadRequest("Email is required.");

  const user = await User.findOne({ email });
  if (!user) throw NotFound("User not found.");
  if (user.isVerified) throw BadRequest("User already verified.");

  const otpCode = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await Otp.deleteMany({ email });
  await Otp.create({ email, code: otpCode, expiresAt });
  // await sendEmail(email, `Your verification code is: ${otpCode}`);

  successResponse(res, {}, "OTP sent to email");
});

// Verify OTP
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    throw BadRequest("Email and OTP code are required.");
  }

  const otpRecord = await Otp.findOne({ email, code });
  if (!otpRecord) throw BadRequest("Invalid or expired OTP.");
  if (otpRecord.expiresAt < new Date()) {
    await otpRecord.deleteOne();
    throw BadRequest("OTP has expired.");
  }

  const user = await User.findOne({ email });
  if (!user) throw NotFound("User not found.");

  user.isVerified = true;
  await user.save();
  await otpRecord.deleteOne();

  successResponse(res, {}, "Email verified successfully");
});

export {
  register,
  createUser,
  forgotPassword,
  resetPassword,
  loginUser,
  requestOtp,
  verifyOtp,
};