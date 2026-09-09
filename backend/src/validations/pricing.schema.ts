import { z } from "zod";
import {
  MAX_PRICING_MONEY,
  MIN_PRICING_DISCOUNT,
} from "../utils/limits.js";

const nonNegativeMoney = z
  .number()
  .finite()
  .min(0)
  .max(MAX_PRICING_MONEY, `Value must be at most ${MAX_PRICING_MONEY}`);

/** Allow negative for discounts (e.g. doubleSidedDiscount). */
const signedMoney = z
  .number()
  .finite()
  .min(MIN_PRICING_DISCOUNT)
  .max(MAX_PRICING_MONEY);

export const pricingRulesSchema = z.object({
  basePricePerPage: nonNegativeMoney,
  colorPremium: nonNegativeMoney,
  doubleSidedDiscount: signedMoney,
  paperTypePremium: z.object({
    matte: nonNegativeMoney,
    glossy: nonNegativeMoney,
    cardstock: nonNegativeMoney,
    recycled: nonNegativeMoney,
  }),
  paperSizePremium: z.object({
    A3: nonNegativeMoney,
    A4: nonNegativeMoney,
    A5: nonNegativeMoney,
    letter: nonNegativeMoney,
    legal: nonNegativeMoney,
  }),
  bindingCost: z.object({
    none: nonNegativeMoney,
    stapled: nonNegativeMoney,
    spiral: nonNegativeMoney,
    hardcover: nonNegativeMoney,
  }),
  finishingCost: z.object({
    none: nonNegativeMoney,
    lamination: nonNegativeMoney,
  }),
});

export const updatePricingConfigBodySchema = z.object({
  rules: pricingRulesSchema,
});

export type UpdatePricingConfigBody = z.infer<
  typeof updatePricingConfigBodySchema
>;
export type PricingRulesInput = z.infer<typeof pricingRulesSchema>;
