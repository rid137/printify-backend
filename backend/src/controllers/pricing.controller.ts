import asyncHandler from "../middlewares/async-handler.middleware.js";
import { successResponse } from "../utils/apiResponse.js";
import { PricingService } from "../services/pricing.service.js";
import type { UpdatePricingConfigBody } from "../validations/pricing.schema.js";

const getPricingConfig = asyncHandler(async (_req, res) => {
  const data = await PricingService.getConfigForAdmin();
  successResponse(res, data, "Pricing configuration retrieved successfully");
});

const updatePricingConfig = asyncHandler(async (req, res) => {
  const { rules } = req.body as UpdatePricingConfigBody;
  const data = await PricingService.updateConfig(rules, req.user._id);
  successResponse(res, data, "Pricing configuration updated successfully");
});

export { getPricingConfig, updatePricingConfig };
