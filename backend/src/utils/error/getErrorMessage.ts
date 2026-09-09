export function getErrorMessage(error: unknown): string {
  let message = "An error occurred";

  if (error instanceof Error) {
    message = error.message;
  } else if (error && typeof error === "object" && "message" in error) {
    message = String(error.message);
  } else if (typeof error === "string") {
    message = error;
  }

  return sanitizeForLog(message);
}

/** Strip credentials from log-facing messages (Mongo URIs, bearer tokens). */
export function sanitizeForLog(message: string): string {
  return message
    .replace(/mongodb(\+srv)?:\/\/[^@\s]+@/gi, "mongodb$1://***@")
    .replace(/Bearer\s+\S+/gi, "Bearer ***");
}
