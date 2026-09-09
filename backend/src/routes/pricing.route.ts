import express from "express";
import { calculatePublicPrice } from "../controllers/public-pricing.controller.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { calculatePriceBodySchema } from "../validations/order.schema.js";

const router = express.Router();

router.post(
  "/calculate",
  validateBody(calculatePriceBodySchema),
  calculatePublicPrice
);

export default router;
