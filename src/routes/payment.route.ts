import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { initializePayment, verifyPayment } from "../controllers/payment.controller.js";

const router = express.Router();

router.use(authenticate);

router.post("/initialize", initializePayment)
router.get("/verify", verifyPayment)

export default router;