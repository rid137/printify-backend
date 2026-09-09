import dotenv from "dotenv";
dotenv.config();

import connectDB from "../config/db.js";
import Order from "../models/order.model.js";
import {
  calculatePriceFromRules,
} from "../services/pricing.service.js";
import { DEFAULT_PRICING_RULES } from "../types/pricing.types.js";
import type { PrintingOptions } from "../types/order.types.js";

/**
 * One-time / idempotent migration: convert legacy single-file orders into items[].
 * Does not delete historical data; populates items from file/printingOptions/quantity
 * and sets itemsSubtotal/currency. Pricing snapshot uses DEFAULT_PRICING_RULES at
 * rulesVersion 0 when original config version is unknown.
 *
 * Safe to re-run: skips documents that already have items.
 */
const migrateLegacyOrders = async () => {
  await connectDB();

  const legacyOrders = await Order.find({
    $or: [{ items: { $exists: false } }, { items: { $size: 0 } }],
    "file.url": { $exists: true, $ne: null },
  });

  console.log(`Found ${legacyOrders.length} legacy order(s) to migrate`);

  let migrated = 0;

  for (const order of legacyOrders) {
    if (!order.file || !order.printingOptions || !order.quantity) {
      console.warn(`Skipping order ${order._id}: incomplete legacy fields`);
      continue;
    }

    const calc = calculatePriceFromRules(
      order.printingOptions as PrintingOptions,
      order.quantity,
      order.file.pages,
      DEFAULT_PRICING_RULES,
      0
    );

    order.items = [
      {
        file: {
          url: order.file.url,
          publicId: "legacy",
          fileName: order.file.fileName,
          pages: order.file.pages,
        },
        printingOptions: order.printingOptions,
        quantity: order.quantity,
        unitPrice: calc.pricePerUnit,
        subtotal: order.totalPrice,
        pricingSnapshot: {
          rulesVersion: 0,
          rules: calc.rulesSnapshot,
          breakdown: calc.breakdown,
        },
      },
    ];
    order.itemsSubtotal = order.totalPrice;
    order.currency = order.currency || "NGN";

    await order.save();
    migrated += 1;
  }

  console.log(`Migrated ${migrated} order(s)`);
  process.exit(0);
};

migrateLegacyOrders().catch((error) => {
  console.error("Legacy order migration failed:", error);
  process.exit(1);
});
