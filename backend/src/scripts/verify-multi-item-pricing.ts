/**
 * Focused Phase 7 checks: multi-item pricing sums and snapshot independence.
 * Run: node --loader ts-node/esm src/scripts/verify-multi-item-pricing.ts
 * (or against dist after build)
 */
import {
  calculatePriceFromRules,
} from "../services/pricing.service.js";
import { DEFAULT_PRICING_RULES } from "../types/pricing.types.js";
import type { PrintingOptions } from "../types/order.types.js";

const itemA: PrintingOptions = {
  color: "color",
  sides: "double",
  paperType: "glossy",
  paperSize: "A4",
  binding: "spiral",
  finishing: "lamination",
};

const itemB: PrintingOptions = {
  color: "black-white",
  sides: "single",
  paperType: "matte",
  paperSize: "A5",
  binding: "none",
  finishing: "none",
};

const calcA = calculatePriceFromRules(itemA, 2, 10, DEFAULT_PRICING_RULES, 3);
const calcB = calculatePriceFromRules(itemB, 1, 5, DEFAULT_PRICING_RULES, 3);
const itemsSubtotal = calcA.total + calcB.total;

const soloA = calculatePriceFromRules(itemA, 2, 10, DEFAULT_PRICING_RULES, 3).total;
const soloB = calculatePriceFromRules(itemB, 1, 5, DEFAULT_PRICING_RULES, 3).total;

let failed = 0;

const assert = (cond: boolean, msg: string) => {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  } else {
    console.log("PASS:", msg);
  }
};

assert(calcA.total === soloA, "item A price independent of cart");
assert(calcB.total === soloB, "item B price independent of cart");
assert(itemsSubtotal === soloA + soloB, "order total equals sum of item subtotals");
assert(calcA.rulesVersion === 3 && calcB.rulesVersion === 3, "rulesVersion snapshotted");
assert(
  JSON.stringify(calcA.rulesSnapshot) === JSON.stringify(DEFAULT_PRICING_RULES),
  "rules snapshot stored"
);

// Changing rules must not change a prior snapshot total when recalculated from snapshot
const raised = {
  ...DEFAULT_PRICING_RULES,
  basePricePerPage: DEFAULT_PRICING_RULES.basePricePerPage + 100,
};
const fromSnapshot = calculatePriceFromRules(
  itemA,
  2,
  10,
  calcA.rulesSnapshot,
  calcA.rulesVersion
);
const fromNewRules = calculatePriceFromRules(itemA, 2, 10, raised, 4);
assert(
  fromSnapshot.total === calcA.total,
  "historical snapshot recalculation unchanged"
);
assert(
  fromNewRules.total !== calcA.total,
  "new config would change price (proves snapshot matters)"
);

// Reject client trust: unitPrice fields are not part of create schema (manual)
import { createOrderBodySchema } from "../validations/order.schema.js";

const sneaky = createOrderBodySchema.safeParse({
  items: [
    {
      file: {
        url: "https://x",
        publicId: "u1",
        fileName: "a.pdf",
        pages: 1,
      },
      printingOptions: itemB,
      quantity: 1,
      unitPrice: 1,
      subtotal: 1,
    },
  ],
});
assert(!sneaky.success, "create schema rejects client-supplied unitPrice/subtotal");

const omittedPages = createOrderBodySchema.safeParse({
  items: [
    {
      file: {
        url: "https://x",
        publicId: "u1",
        fileName: "a.pdf",
      },
      printingOptions: itemB,
      quantity: 1,
    },
  ],
});
assert(
  omittedPages.success,
  "create schema does not require client pages (server supplies them)"
);

const noPublicId = createOrderBodySchema.safeParse({
  items: [
    {
      file: {
        url: "https://x",
        fileName: "a.pdf",
        pages: 99,
      },
      printingOptions: itemB,
      quantity: 1,
    },
  ],
});
assert(!noPublicId.success, "create schema requires publicId");

process.exit(failed === 0 ? 0 : 1);
