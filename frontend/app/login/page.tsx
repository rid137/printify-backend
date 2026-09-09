"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { Alert, LoadingState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { authApi } from "@/lib/api/auth";
import { ApiError, toUserMessage } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { safeInternalPath } from "@/lib/navigation";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading sign-in…" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { setSession, user, ready } = useAuth();
  const nextPath = safeInternalPath(params.get("next"));
  const expired = params.get("reason") === "expired";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(expired ? "Your session has expired. Please sign in again." : "");
  const [unverified, setUnverified] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace(nextPath);
  }, [ready, user, router, nextPath]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setUnverified(false);
    try {
      const sessionUser = await authApi.login({ email: email.trim(), password });
      if (!setSession(sessionUser)) {
        setError("Sign-in did not return a session. Please try again.");
        return;
      }
      router.push(nextPath);
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;
      if (apiError?.statusCode === 403) {
        setUnverified(true);
        setError("Email verification required. Check your inbox or request a new code.");
      } else {
        setError(toUserMessage(err, "Unable to log in."));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Log in" subtitle="Verified accounts receive a session token. Unverified accounts cannot sign in.">
      <form onSubmit={onSubmit} className="space-y-4">
        {error ? <Alert tone="error">{error}</Alert> : null}
        {unverified ? (
          <p className="text-sm">
            <Link className="text-harvest" href={`/verify-otp?email=${encodeURIComponent(email.trim())}`}>
              Verify your email
            </Link>
          </p>
        ) : null}
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Signing in…" : "Log in"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        <Link className="text-harvest" href="/forgot-password">
          Forgot password
        </Link>
        {" · "}
        <Link className="text-harvest" href="/verify-otp">
          Verify email
        </Link>
      </p>
      <p className="mt-2 text-sm text-muted">
        No account?{" "}
        <Link className="text-harvest" href="/register">
          Register
        </Link>
      </p>
    </AuthCard>
  );
}
