export interface PricingRule {
  basePricePerPage: number;
  colorPremium: number;
  /** Applied per page when sides === 'double' (negative = discount). */
  doubleSidedDiscount: number;
  paperTypePremium: {
    matte: number;
    glossy: number;
    cardstock: number;
    recycled: number;
  };
  /**
   * Per-page premium by paper size.
   * Seeded as all zeros to preserve historical totals (paperSize was unused before).
   */
  paperSizePremium: {
    A3: number;
    A4: number;
    A5: number;
    letter: number;
    legal: number;
  };
  bindingCost: {
    none: number;
    stapled: number;
    spiral: number;
    hardcover: number;
  };
  finishingCost: {
    none: number;
    lamination: number;
  };
}

/** Exact historical hardcoded rules (plus zero paperSize premiums for parity). */
export const DEFAULT_PRICING_RULES: PricingRule = {
  basePricePerPage: 50,
  colorPremium: 30,
  doubleSidedDiscount: -10,
  paperTypePremium: {
    matte: 0,
    glossy: 20,
    cardstock: 40,
    recycled: 5,
  },
  paperSizePremium: {
    A3: 0,
    A4: 0,
    A5: 0,
    letter: 0,
    legal: 0,
  },
  bindingCost: {
    none: 0,
    stapled: 100,
    spiral: 300,
    hardcover: 500,
  },
  finishingCost: {
    none: 0,
    lamination: 300,
  },
};

export interface PriceBreakdown {
  baseCost: number;
  colorPremium: number;
  doubleSidedDiscount: number;
  paperTypePremium: number;
  paperSizePremium: number;
  bindingCost: number;
  finishingCost: number;
}

export interface PriceCalculationResult {
  total: number;
  totalPrice: number;
  currency: string;
  pricePerUnit: number;
  totalPages: number;
  breakdown: PriceBreakdown;
  rulesVersion: number;
  /** Snapshot-ready copy of the rules used for this calculation. */
  rulesSnapshot: PricingRule;
}
