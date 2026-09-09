import express from "express";
import {
  getPricingConfig,
  updatePricingConfig,
} from "../../controllers/pricing.controller.js";
import {
  authenticate,
  authorizeAdmin,
} from "../../middlewares/auth.middleware.js";
import { validateBody } from "../../middlewares/validate.middleware.js";
import { updatePricingConfigBodySchema } from "../../validations/pricing.schema.js";

const router = express.Router();

router.use(authenticate, authorizeAdmin);

router.get("/", getPricingConfig);
router.put(
  "/",
  validateBody(updatePricingConfigBodySchema),
  updatePricingConfig
);

export default router;
