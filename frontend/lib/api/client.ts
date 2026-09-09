import type { ApiErrorBody } from "./types";
import { getAccessToken } from "../auth/session";

function resolveApiUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }
  return "http://localhost:8080";
}

const API_URL = resolveApiUrl();

export class ApiError extends Error {
  statusCode: number;
  code?: string;
  details?: unknown;

  constructor(message: string, statusCode: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

type TokenGetter = () => string | null;
type UnauthorizedHandler = () => void;

let getToken: TokenGetter = getAccessToken;
let onUnauthorized: UnauthorizedHandler = () => {};

export function configureApi(options: {
  getToken: TokenGetter;
  onUnauthorized: UnauthorizedHandler;
}) {
  getToken = options.getToken;
  onUnauthorized = options.onUnauthorized;
}

function isTechnicalMessage(message: string): boolean {
  return /axioserror|fetch failed|failed to fetch|err_bad_request|err_network|internal server error|networkerror/i.test(
    message
  );
}

function parseError(status: number, body: unknown, retryAfter?: string | null): ApiError {
  const envelope = body as ApiErrorBody | undefined;
  const err = envelope?.error;
  const backendMessage =
    err && typeof err.message === "string" && err.message.trim() ? err.message.trim() : "";
  const statusCode = (err && typeof err.statusCode === "number" && err.statusCode) || status;
  const code = err && typeof err.code === "string" ? err.code : undefined;
  const details = err?.details;

  if (statusCode === 429) {
    const wait = retryAfter ? ` Try again in ${retryAfter} seconds.` : " Please wait a moment and try again.";
    const message =
      backendMessage && !isTechnicalMessage(backendMessage)
        ? backendMessage
        : `Too many requests.${wait}`;
    return new ApiError(message, 429, code || "ERR_RATE_LIMIT", details);
  }

  if (backendMessage && !isTechnicalMessage(backendMessage)) {
    return new ApiError(backendMessage, statusCode || status, code, details);
  }

  if (statusCode === 401) {
    return new ApiError("Your session has expired. Please sign in again.", 401, code || "ERR_AUTH", details);
  }
  if (statusCode === 403) {
    return new ApiError("You do not have permission to do that.", 403, code || "ERR_FORBIDDEN", details);
  }
  if (statusCode === 404) {
    return new ApiError("The requested resource was not found.", 404, code || "ERR_NF", details);
  }
  if (statusCode === 409) {
    return new ApiError(
      "This record was updated by another request. Refresh to see the latest status.",
      409,
      code || "ERR_CONFLICT",
      details
    );
  }
  if (statusCode === 400) {
    return new ApiError("Please check the form and try again.", 400, code || "ERR_VALID", details);
  }

  return new ApiError(
    "We couldn't complete that action. Please try again.",
    statusCode || 500,
    code || "ERR_INTERNAL",
    details
  );
}

export function toUserMessage(
  err: unknown,
  fallback = "We couldn't complete that action. Please try again."
): string {
  if (err instanceof ApiError) {
    if (err.message && !isTechnicalMessage(err.message)) return err.message;
    return fallback;
  }
  if (err instanceof Error && /failed to fetch|networkerror|load failed/i.test(err.message)) {
    return "We couldn't reach the server. Check your connection and try again.";
  }
  return fallback;
}

export function fieldErrors(details: unknown): Record<string, string> {
  if (!Array.isArray(details)) return {};
  const map: Record<string, string> = {};
  for (const item of details) {
    if (
      item &&
      typeof item === "object" &&
      "path" in item &&
      "message" in item &&
      typeof (item as { path: unknown }).path === "string" &&
      typeof (item as { message: unknown }).message === "string"
    ) {
      map[(item as { path: string }).path] = (item as { message: string }).message;
    }
  }
  return map;
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  auth?: boolean;
  formData?: FormData;
  onProgress?: (percent: number) => void;
};

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(`${API_URL}${path.startsWith("/") ? path : `/${path}`}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

function unwrapData<T>(parsed: unknown): T {
  const envelope = parsed as { data?: T } | null;
  if (envelope && typeof envelope === "object" && "data" in envelope) {
    return envelope.data as T;
  }
  return parsed as T;
}

function readRetryAfter(headers: { get(name: string): string | null }): string | null {
  return headers.get("Retry-After") || headers.get("retry-after");
}

async function parseBody(text: string): Promise<unknown> {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function throwIfFailed(
  ok: boolean,
  status: number,
  parsed: unknown,
  auth: boolean,
  retryAfter?: string | null
): void {
  if (ok) return;
  const error = parseError(status, parsed, retryAfter);
  if (error.statusCode === 401 && auth) {
    onUnauthorized();
  }
  throw error;
}

/**
 * In-flight GET coalescing.
 *
 * React Strict Mode remounts in development (this is not disabled). Without
 * coalescing, AuthProvider hydration and page `useEffect` loaders each fire
 * twice for the same URL. Only in-flight GETs are shared — completed responses
 * are not cached, so pagination, retries, and mutations stay fresh.
 */
const inflightGets = new Map<string, Promise<unknown>>();

function inflightGetKey(url: string, auth: boolean): string {
  return `${auth ? "auth" : "anon"}:${url}`;
}

function xhrFormRequest<T>(
  url: string,
  method: string,
  formData: FormData,
  headers: Record<string, string>,
  auth: boolean,
  onProgress?: (percent: number) => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value);
    }
    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      try {
        const parsed = xhr.responseText ? JSON.parse(xhr.responseText) : null;
        throwIfFailed(xhr.status >= 200 && xhr.status < 300, xhr.status, parsed, auth, xhr.getResponseHeader("Retry-After"));
        resolve(unwrapData<T>(parsed));
      } catch (error) {
        reject(error);
      }
    };
    xhr.onerror = () => {
      reject(
        new ApiError(
          "We couldn't reach the server. Check your connection and try again.",
          0,
          "ERR_NETWORK"
        )
      );
    };
    xhr.send(formData);
  });
}

async function sendRequest<T>(
  url: string,
  method: string,
  options: {
    body?: unknown;
    auth: boolean;
    formData?: FormData;
    onProgress?: (percent: number) => void;
  }
): Promise<T> {
  const { body, auth, formData, onProgress } = options;
  const headers: Record<string, string> = {};
  if (!formData) {
    headers["Content-Type"] = "application/json";
  }
  if (auth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  if (formData && onProgress) {
    return xhrFormRequest<T>(url, method, formData, headers, auth, onProgress);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: formData ? formData : body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      "We couldn't reach the server. Check your connection and try again.",
      0,
      "ERR_NETWORK"
    );
  }

  const text = await response.text();
  const parsed = await parseBody(text);
  throwIfFailed(response.ok, response.status, parsed, auth, readRetryAfter(response.headers));
  return unwrapData<T>(parsed);
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, auth = true, formData, onProgress } = options;
  const url = buildUrl(path, query);
  const methodUpper = method.toUpperCase();

  if (methodUpper === "GET" && !formData) {
    const key = inflightGetKey(url, auth);
    const existing = inflightGets.get(key);
    if (existing) return existing as Promise<T>;

    const request = sendRequest<T>(url, methodUpper, { body, auth, formData, onProgress });
    inflightGets.set(key, request);
    void request.finally(() => {
      if (inflightGets.get(key) === request) inflightGets.delete(key);
    });
    return request;
  }

  return sendRequest<T>(url, methodUpper, { body, auth, formData, onProgress });
}
