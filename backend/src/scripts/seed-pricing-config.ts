import PricingConfig, {
  PRICING_CONFIG_KEY,
} from "../models/pricing-config.model.js";
import { DEFAULT_PRICING_RULES } from "../types/pricing.types.js";

/**
 * Idempotent upsert of the singleton active PricingConfig.
 * Seeds the historical hardcoded rules (paperSize premiums = 0 for parity).
 */
export const seedPricingConfig = async (): Promise<void> => {
  const existing = await PricingConfig.findOne({ key: PRICING_CONFIG_KEY });

  if (existing) {
    console.log(
      `PricingConfig already present (version ${existing.version}) — seed skipped`
    );
    return;
  }

  await PricingConfig.findOneAndUpdate(
    { key: PRICING_CONFIG_KEY },
    {
      $setOnInsert: {
        key: PRICING_CONFIG_KEY,
        version: 1,
        rules: DEFAULT_PRICING_RULES,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log("PricingConfig seeded with default historical pricing rules");
};

export default seedPricingConfig;
