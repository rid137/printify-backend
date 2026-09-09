import asyncHandler from "../middlewares/async-handler.middleware.js";
import { createdResponse } from "../utils/apiResponse.js";
import { PricingService } from "../services/pricing.service.js";
import type { CalculatePriceBody } from "../validations/order.schema.js";

/**
 * Public landing-page calculator — no authentication.
 */
const calculatePublicPrice = asyncHandler(async (req, res) => {
  const { printingOptions, quantity, pages } = req.body as CalculatePriceBody;
  const result = await PricingService.calculatePrice(
    printingOptions,
    quantity,
    pages
  );

  createdResponse(
    res,
    {
      total: result.total,
      totalPrice: result.totalPrice,
      currency: result.currency,
      pricePerUnit: result.pricePerUnit,
      totalPages: result.totalPages,
      breakdown: result.breakdown,
      rulesVersion: result.rulesVersion,
    },
    "Price calculated successfully"
  );
});

export { calculatePublicPrice };
