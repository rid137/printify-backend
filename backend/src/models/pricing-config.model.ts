import mongoose, { Document, Schema, model } from "mongoose";
import type { PricingRule } from "../types/pricing.types.js";

export const PRICING_CONFIG_KEY = "active";

export interface IPricingConfig extends Document {
  key: string;
  version: number;
  rules: PricingRule;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const moneyMap = (keys: string[]) =>
  Object.fromEntries(
    keys.map((key) => [
      key,
      { type: Number, required: true },
    ])
  );

const pricingConfigSchema = new Schema<IPricingConfig>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: PRICING_CONFIG_KEY,
    },
    version: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    rules: {
      basePricePerPage: { type: Number, required: true },
      colorPremium: { type: Number, required: true },
      doubleSidedDiscount: { type: Number, required: true },
      paperTypePremium: moneyMap(["matte", "glossy", "cardstock", "recycled"]),
      paperSizePremium: moneyMap(["A3", "A4", "A5", "letter", "legal"]),
      bindingCost: moneyMap(["none", "stapled", "spiral", "hardcover"]),
      finishingCost: moneyMap(["none", "lamination"]),
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const PricingConfig = model<IPricingConfig>(
  "PricingConfig",
  pricingConfigSchema
);

export default PricingConfig;
