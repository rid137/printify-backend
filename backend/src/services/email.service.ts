import {
  sendEmail,
  sendForgotPasswordEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "../utils/email/sendEmail.js";
import { getErrorMessage } from "../utils/error/getErrorMessage.js";
import { InternalServerError } from "../utils/error/httpErrors.js";

const wrapSend = async (
  label: string,
  send: () => Promise<unknown>
): Promise<void> => {
  try {
    await send();
  } catch (error) {
    console.error(`[email] ${label} failed:`, getErrorMessage(error));
    throw InternalServerError(
      "Unable to send email. Please try again later."
    );
  }
};

/**
 * Email integration boundary over Nodemailer + Handlebars templates.
 * Controllers/services should call this rather than sendEmail utils directly.
 * Provider errors are logged without internals and mapped to a generic 500.
 */
export class EmailService {
  static async send(options: {
    to: string;
    subject: string;
    template: string;
    context: Record<string, unknown>;
  }) {
    return wrapSend(options.template, () => sendEmail(options));
  }

  static async sendVerificationEmail(
    email: string,
    username: string,
    otp: string
  ) {
    return wrapSend("verification", () =>
      sendVerificationEmail(email, username, otp)
    );
  }

  static async sendWelcomeEmail(email: string, username: string) {
    return wrapSend("welcome", () => sendWelcomeEmail(email, username));
  }

  static async sendForgotPasswordEmail(
    email: string,
    username: string,
    resetLink: string
  ) {
    return wrapSend("forgot-password", () =>
      sendForgotPasswordEmail(email, username, resetLink)
    );
  }

  static async sendOrderStatusEmail(
    email: string,
    username: string,
    orderId: string,
    status: string,
    statusLabel: string
  ) {
    return wrapSend("order-status", () =>
      sendEmail({
        to: email,
        subject: `Order update: ${statusLabel}`,
        template: "orderStatus",
        context: { username, orderId, status, statusLabel },
      })
    );
  }
}
