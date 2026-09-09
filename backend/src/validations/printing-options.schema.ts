import { z } from "zod";
import type { PrintingOptions } from "../types/order.types.js";

/**
 * Enum values taken from PrintingOptions in types/order.types.ts
 * and the keys used by pricing.service.ts (paperType, binding, finishing).
 */
export const printingOptionsSchema = z.object({
  color: z.enum(["black-white", "color"], {
    error: "Printing option 'color' is required.",
  }),
  sides: z.enum(["single", "double"], {
    error: "Printing option 'sides' is required.",
  }),
  paperType: z.enum(["matte", "glossy", "cardstock", "recycled"], {
    error: "Printing option 'paperType' is required.",
  }),
  paperSize: z.enum(["A3", "A4", "A5", "letter", "legal"], {
    error: "Printing option 'paperSize' is required.",
  }),
  binding: z.enum(["none", "stapled", "spiral", "hardcover"], {
    error: "Printing option 'binding' is required.",
  }),
  finishing: z.enum(["none", "lamination"], {
    error: "Printing option 'finishing' is required.",
  }),
}) satisfies z.ZodType<PrintingOptions>;

export type PrintingOptionsInput = z.infer<typeof printingOptionsSchema>;
