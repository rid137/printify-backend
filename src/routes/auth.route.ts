import express from 'express';
import { forgotPassword, loginUser, register, requestOtp, resetPassword, verifyOtp } from '../controllers/auth.controller.js';

const router = express.Router();

router
  .route("/register")
  .post(register)

router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);
router.post("/login", loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;