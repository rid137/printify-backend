import dotenv from "dotenv";
dotenv.config();

import connectDB from "../config/db.js";
import Order from "../models/order.model.js";
import { canonicalStatusForMigration } from "../utils/order-status.js";
import type { StatusHistoryEntry } from "../types/order.types.js";

/**
 * Idempotent migration: canonicalize pre-Phase-8 order status.
 * Uses the native collection so legacy values (printed/shipped) are not
 * coerced by the new Mongoose enum before they can be mapped.
 *
 * Safe to re-run.
 */
const migrateOrderStatus = async () => {
  await connectDB();

  const cursor = Order.collection.find({});
  let scanned = 0;
  let updated = 0;

  for await (const doc of cursor) {
    scanned += 1;
    const canonical = canonicalStatusForMigration({
      status: typeof doc.status === "string" ? doc.status : undefined,
      isDelivered: Boolean(doc.isDelivered),
    });

    const history = Array.isArray(doc.statusHistory) ? doc.statusHistory : [];
    const needsStatus = doc.status !== canonical;
    const needsDeliveredFlag =
      canonical === "delivered"
        ? doc.isDelivered !== true
        : Boolean(doc.isDelivered);
    const needsHistory = history.length === 0;

    if (!needsStatus && !needsDeliveredFlag && !needsHistory) {
      continue;
    }

    const $set: Record<string, unknown> = {
      status: canonical,
      isDelivered: canonical === "delivered",
    };

    if (canonical === "delivered" && !doc.deliveredAt) {
      $set.deliveredAt = doc.updatedAt || new Date();
    }

    if (needsHistory) {
      const seed: StatusHistoryEntry = {
        status: canonical,
        at: doc.createdAt instanceof Date ? doc.createdAt : new Date(),
      };
      $set.statusHistory = [seed];
    }

    await Order.collection.updateOne({ _id: doc._id }, { $set });
    updated += 1;
    console.log(`Updated order ${String(doc._id)}: ${canonical}`);
  }

  console.log(`Scanned ${scanned} order(s); canonicalized ${updated}`);
  process.exit(0);
};

migrateOrderStatus().catch((error) => {
  console.error("Order status migration failed:", error);
  process.exit(1);
});
