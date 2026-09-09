/**
 * Resource/input bounds for abuse/DoS protection (Phase 9.5).
 * Not a product redesign — legitimate carts stay well under these.
 */
export const MAX_ORDER_ITEMS = 20;
export const MAX_QUANTITY = 100;
export const MAX_PAGE_COUNT = 10_000;
export const MAX_UPLOAD_FILES = 10;
export const MAX_FCM_TOKEN_LENGTH = 4096;

/**
 * Admin pricing rules are trusted but must stay finite.
 * Values are NGN units used by the existing calculation (per page / per line).
 * 1_000_000 NGN per component is far above any realistic print price.
 */
export const MAX_PRICING_MONEY = 1_000_000;
export const MIN_PRICING_DISCOUNT = -1_000_000;

export const MIN_PRODUCTION_JWT_SECRET_LENGTH = 32;
export const WEAK_JWT_SECRETS = ["change-me", "secret", "password", "jwt-secret"];
