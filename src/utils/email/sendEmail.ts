// import nodemailer from 'nodemailer';
// import dotenv from 'dotenv';
// dotenv.config();
// // PLAIN

// // const transporter = nodemailer.createTransport({
// //   service: 'gmail', // or 'outlook', 'yahoo', etc.
// //   auth: {
// //     user: process.env.EMAIL_USER,
// //     pass: process.env.EMAIL_PASS,
// //   },
// // });

// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 465,
//   secure: true, // use SSL
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//     // user: "makinderidwan73@gmail.com",
//     // pass: "qdpzehocuegoyzan",
//   },
// });

// const sendEmail = async (to: string, text: string) => {
//   const mailOptions = {
//     from: `"Printing App" <${process.env.EMAIL_USER}>`,
//     to,
//     subject: 'Your OTP Code',
//     text,
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     console.log('Email sent to', to);
//   } catch (error) {
//     console.error('Failed to send email:', error);
//     throw new Error('Email sending failed');
//   }
// };

// export default sendEmail;

import nodemailer from 'nodemailer';
import path from 'path';
import { create } from 'express-handlebars';
import { default as nodemailerExpressHandlebars } from 'nodemailer-express-handlebars';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Convert import.meta.url to __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Create reusable transporter object
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '465'),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Configure Handlebars
const hbs = create({
  extname: '.hbs',
  defaultLayout: false, // We'll specify layouts in the transporter config
});

// Configure template engine
transporter.use(
  'compile',
  nodemailerExpressHandlebars({
    viewEngine: {
      extname: '.hbs',
      layoutsDir: path.resolve(__dirname, 'templates/layouts'),
      partialsDir: path.resolve(__dirname, 'templates/partials'),
      defaultLayout: 'base',
    },
    viewPath: path.resolve(__dirname, 'templates'),
    extName: '.hbs',
  })
);

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

export const sendEmail = async (options: EmailOptions) => {
  const currentYear = new Date().getFullYear();
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'App Name'}" <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    template: options.template,
    context: {
      ...options.context,
      appName: process.env.APP_NAME || 'Our App',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
      baseUrl: process.env.BASE_URL || 'https://yourapp.com',
      logoUrl: process.env.LOGO_URL || '',
      year: currentYear,
    },
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent to', options.to);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('Email sending failed');
  }
};

// Specific email functions
export const sendVerificationEmail = async (email: string, username: string, otp: string) => {
  return sendEmail({
    to: email,
    subject: 'Verify Your Email Address',
    template: 'verification',
    context: { username, otp },
  });
};

export const sendWelcomeEmail = async (email: string, username: string) => {
  return sendEmail({
    to: email,
    subject: 'Welcome to Our App!',
    template: 'welcome',
    context: { username },
  });
};

export const sendForgotPasswordEmail = async (email: string, username: string, resetLink: string) => {
  return sendEmail({
    to: email,
    subject: 'Reset Your Password',
    template: 'forgotPassword',
    context: { username, resetLink },
  });
};

export default sendEmail;