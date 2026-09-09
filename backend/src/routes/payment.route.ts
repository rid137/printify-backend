import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import {
  initializePayment,
  verifyPayment,
} from "../controllers/payment.controller.js";
import {
  validateBody,
  validateQuery,
} from "../middlewares/validate.middleware.js";
import {
  initializePaymentBodySchema,
  verifyPaymentQuerySchema,
} from "../validations/payment.schema.js";

const router = express.Router();

// JWT-protected payment endpoints only. Webhook is mounted separately in app.ts
// with express.raw() and without authenticate.
router.use(authenticate);

router.post(
  "/initialize",
  validateBody(initializePaymentBodySchema),
  initializePayment
);
router.get("/verify", validateQuery(verifyPaymentQuerySchema), verifyPayment);

export default router;
