import { apiRequest } from "./client";
import type { PricingConfig, PricingRules, PrintingOptions, PublicQuote } from "./types";

export const pricingApi = {
  quote: (body: { printingOptions: PrintingOptions; quantity: number; pages: number }) =>
    apiRequest<PublicQuote>("/api/pricing/calculate", {
      method: "POST",
      body,
      auth: false,
    }),

  getConfig: () => apiRequest<PricingConfig>("/api/admin/pricing"),

  updateConfig: (rules: PricingRules) =>
    apiRequest<PricingConfig>("/api/admin/pricing", {
      method: "PUT",
      body: { rules },
    }),
};
