"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { Alert, LoadingState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { authApi } from "@/lib/api/auth";
import { ApiError, toUserMessage } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";

function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { setSession } = useAuth();
  const [email, setEmail] = useState(params.get("email") || "");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const user = await authApi.verifyOtp({ email: email.trim(), code: code.trim() });
      if (!setSession(user)) {
        setError("Verification succeeded but no session was issued. Try logging in.");
        return;
      }
      router.push("/dashboard");
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;
      if (apiError?.statusCode === 400) {
        setError(apiError.message || "That code is invalid or has expired.");
      } else {
        setError(toUserMessage(err, "Unable to verify."));
      }
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (!email.trim()) {
      setError("Enter your email to request a new code.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await authApi.requestOtp({ email: email.trim() });
      setInfo("If an account exists for this email, a message has been sent.");
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;
      if (apiError?.statusCode === 429) {
        setError(toUserMessage(err));
      } else {
        setInfo("If an account exists for this email, a message has been sent.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Verify email" subtitle="Successful verification issues your access token.">
      <form onSubmit={onSubmit} className="space-y-4">
        {error ? <Alert tone="error">{error}</Alert> : null}
        {info ? <Alert>{info}</Alert> : null}
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
        <Field label="6-digit code" htmlFor="code">
          <Input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
        </Field>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Verifying…" : "Verify and continue"}
        </Button>
      </form>
      <button type="button" className="mt-4 text-sm text-harvest" onClick={resend} disabled={busy || !email}>
        Request a new code
      </button>
      <p className="mt-3 text-sm text-muted">
        <Link className="text-harvest" href="/login">
          Back to login
        </Link>
      </p>
    </AuthCard>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading verification…" />}>
      <VerifyForm />
    </Suspense>
  );
}
