export const MAX_UPLOAD_FILES = 10;
/** Client UX hint matching the backend default. The API remains authoritative. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_UPLOAD_EXTENSIONS = [".pdf", ".docx", ".pptx"] as const;
export const MAX_QUANTITY = 100;
export const MAX_PAGE_COUNT = 10_000;
export const MAX_ORDER_ITEMS = 20;
export const MAX_FCM_TOKEN_LENGTH = 4096;
export const MAX_PRICING_MONEY = 1_000_000;
export const MIN_PRICING_DISCOUNT = -1_000_000;

export const TOKEN_KEY = "printify.accessToken";
export const USER_KEY = "printify.user";
export const THEME_KEY = "printify.theme";

export const PRINTING_COLORS = ["black-white", "color"] as const;
export const PRINTING_SIDES = ["single", "double"] as const;
export const PAPER_TYPES = ["matte", "glossy", "cardstock", "recycled"] as const;
export const PAPER_SIZES = ["A3", "A4", "A5", "letter", "legal"] as const;
export const BINDINGS = ["none", "stapled", "spiral", "hardcover"] as const;
export const FINISHINGS = ["none", "lamination"] as const;

export const ORDER_STATUSES = [
  "pending",
  "received",
  "processing",
  "completed",
  "delivered",
  "cancelled",
] as const;

export const ADMIN_TARGET_STATUSES = [
  "received",
  "processing",
  "completed",
  "delivered",
] as const;

export const TRANSACTION_STATUSES = ["pending", "success"] as const;

export const defaultPrintingOptions = {
  color: "black-white" as const,
  sides: "single" as const,
  paperType: "matte" as const,
  paperSize: "A4" as const,
  binding: "none" as const,
  finishing: "none" as const,
};
