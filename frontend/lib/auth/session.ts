import { TOKEN_KEY, USER_KEY } from "../constants";
import type { User } from "../api/types";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function persistUser(user: User): void {
  if (typeof window === "undefined") return;
  const stored = { ...user };
  delete stored.accessToken;
  window.sessionStorage.setItem(USER_KEY, JSON.stringify(stored));
}

/** Stores the Bearer token and public user. Returns null when no token is present. */
export function persistSession(user: User): { token: string; user: User } | null {
  const token = user.accessToken;
  if (!token || typeof window === "undefined") return null;
  const stored = { ...user };
  delete stored.accessToken;
  window.sessionStorage.setItem(TOKEN_KEY, token);
  window.sessionStorage.setItem(USER_KEY, JSON.stringify(stored));
  return { token, user: stored };
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(USER_KEY);
}
