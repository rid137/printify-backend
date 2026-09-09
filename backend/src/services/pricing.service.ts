import type { PrintingOptions } from "../types/order.types.js";
import {
  DEFAULT_PRICING_RULES,
  type PriceBreakdown,
  type PriceCalculationResult,
  type PricingRule,
} from "../types/pricing.types.js";
import PricingConfig, {
  PRICING_CONFIG_KEY,
  type IPricingConfig,
} from "../models/pricing-config.model.js";
import { NotFound } from "../utils/error/httpErrors.js";
import type { PricingRulesInput } from "../validations/pricing.schema.js";

const toPlainRules = (rules: PricingRule): PricingRule => ({
  basePricePerPage: rules.basePricePerPage,
  colorPremium: rules.colorPremium,
  doubleSidedDiscount: rules.doubleSidedDiscount,
  paperTypePremium: { ...rules.paperTypePremium },
  paperSizePremium: { ...rules.paperSizePremium },
  bindingCost: { ...rules.bindingCost },
  finishingCost: { ...rules.finishingCost },
});

/**
 * Pure calculation against an explicit rules object (used for seed parity tests
 * and by calculatePrice with the active DB config).
 */
export const calculatePriceFromRules = (
  options: PrintingOptions,
  quantity: number,
  pages: number,
  rules: PricingRule,
  rulesVersion = 0
): PriceCalculationResult => {
  let pricePerPage = rules.basePricePerPage;

  const colorPremiumPerPage =
    options.color === "color" ? rules.colorPremium : 0;
  const doubleSidedPerPage =
    options.sides === "double" ? rules.doubleSidedDiscount : 0;
  const paperTypePerPage = rules.paperTypePremium[options.paperType];
  const paperSizePerPage = rules.paperSizePremium[options.paperSize];

  pricePerPage +=
    colorPremiumPerPage +
    doubleSidedPerPage +
    paperTypePerPage +
    paperSizePerPage;

  const bindingCost = rules.bindingCost[options.binding];
  const finishingCost = rules.finishingCost[options.finishing];

  const pageComponent = pricePerPage * pages * quantity;
  const total = Math.round(pageComponent + bindingCost + finishingCost);

  const breakdown: PriceBreakdown = {
    baseCost: rules.basePricePerPage * pages * quantity,
    colorPremium: colorPremiumPerPage * pages * quantity,
    doubleSidedDiscount: doubleSidedPerPage * pages * quantity,
    paperTypePremium: paperTypePerPage * pages * quantity,
    paperSizePremium: paperSizePerPage * pages * quantity,
    bindingCost,
    finishingCost,
  };

  return {
    total,
    totalPrice: total,
    currency: "NGN",
    pricePerUnit: total / quantity,
    totalPages: pages * quantity,
    breakdown,
    rulesVersion,
    rulesSnapshot: toPlainRules(rules),
  };
};

export class PricingService {
  static async getActiveConfig(): Promise<IPricingConfig> {
    const config = await PricingConfig.findOne({ key: PRICING_CONFIG_KEY });
    if (!config) {
      throw NotFound(
        "Pricing configuration not found. Run the pricing seed on startup."
      );
    }
    return config;
  }

  static async getActiveRules(): Promise<{
    rules: PricingRule;
    version: number;
  }> {
    const config = await this.getActiveConfig();
    return {
      rules: toPlainRules(config.rules),
      version: config.version,
    };
  }

  static async calculatePrice(
    options: PrintingOptions,
    quantity: number,
    pages: number
  ): Promise<PriceCalculationResult> {
    const { rules, version } = await this.getActiveRules();
    return calculatePriceFromRules(options, quantity, pages, rules, version);
  }

  static async getConfigForAdmin() {
    const config = await this.getActiveConfig();
    return {
      key: config.key,
      version: config.version,
      rules: toPlainRules(config.rules),
      updatedBy: config.updatedBy ?? null,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  static async updateConfig(rules: PricingRulesInput, adminUserId: unknown) {
    const config = await this.getActiveConfig();

    config.rules = toPlainRules(rules);
    config.version = config.version + 1;
    config.updatedBy = adminUserId as typeof config.updatedBy;
    await config.save();

    return this.getConfigForAdmin();
  }
}

/** @deprecated Prefer PricingService.calculatePrice — kept for parity scripts. */
export const pricingRules = DEFAULT_PRICING_RULES;

/** Sync helper against default rules only (parity / tests). */
export const calculatePrice = (
  options: PrintingOptions,
  quantity: number,
  pages: number
): number =>
  calculatePriceFromRules(
    options,
    quantity,
    pages,
    DEFAULT_PRICING_RULES,
    0
  ).total;
