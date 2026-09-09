"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { configureApi, ApiError } from "./api/client";
import { usersApi } from "./api/users";
import type { User } from "./api/types";
import {
  clearSession,
  getAccessToken,
  getStoredUser,
  persistSession,
  persistUser,
} from "./auth/session";
import { isPublicPath, loginHref } from "./navigation";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  ready: boolean;
  setSession: (user: User) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  const setSession = useCallback((next: User) => {
    const persisted = persistSession(next);
    if (!persisted) return false;
    setToken(persisted.token);
    setUser(persisted.user);
    return true;
  }, []);

  // Hydrate once per provider mount. React Strict Mode remounts in development
  // (left enabled); duplicate in-flight GETs are coalesced in lib/api/client.ts.
  // Unrelated re-renders must not refetch /profile. 401 still clears the session;
  // network/5xx keep the cached user so a downed API does not log anyone out.
  useEffect(() => {
    let cancelled = false;

    configureApi({
      getToken: getAccessToken,
      onUnauthorized: () => {
        clearSession();
        setToken(null);
        setUser(null);
        const path = window.location.pathname;
        if (isPublicPath(path)) return;
        routerRef.current.replace(loginHref(`${path}${window.location.search}`, "expired"));
      },
    });

    const existing = getAccessToken();
    const storedUser = getStoredUser();
    setToken(existing);
    setUser(storedUser);

    if (!existing) {
      setReady(true);
      return;
    }

    usersApi
      .profile()
      .then((profile) => {
        if (cancelled) return;
        persistUser(profile);
        setUser(profile);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.statusCode === 401) {
          clearSession();
          setToken(null);
          setUser(null);
          return;
        }
        // Keep the cached session on network/5xx so a downed API does not log the user out.
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ user, token, ready, setSession, logout }),
    [user, token, ready, setSession, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
