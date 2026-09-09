const AUTH_PATHS = new Set([
  "/login",
  "/register",
  "/verify-otp",
  "/forgot-password",
  "/reset-password",
]);

export function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.has(pathname);
}

/** Marketing + auth screens must not be forced to login on a stale token. */
export function isPublicPath(pathname: string): boolean {
  return pathname === "/" || isAuthPath(pathname);
}

/**
 * Only allow same-origin relative paths. Reject protocol-relative and open redirects.
 */
export function safeInternalPath(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (value.includes("://")) return fallback;
  const pathOnly = value.split("?")[0];
  if (isAuthPath(pathOnly) || pathOnly === "/") return fallback;
  return value;
}

export function loginHref(next?: string | null, reason?: "expired"): string {
  const params = new URLSearchParams();
  const dest = next ? safeInternalPath(next, "") : "";
  if (dest && dest !== "/login") params.set("next", dest);
  if (reason) params.set("reason", reason);
  const query = params.toString();
  return query ? `/login?${query}` : "/login";
}
