"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { Alert } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { authApi } from "@/lib/api/auth";
import { ApiError, toUserMessage } from "@/lib/api/client";

const GENERIC = "If an account exists for this email, a message has been sent.";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setInfo("");
    try {
      await authApi.forgotPassword({ email: email.trim() });
      setInfo(GENERIC);
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;
      if (apiError?.statusCode === 429) {
        setError(toUserMessage(err));
      } else {
        setInfo(GENERIC);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Forgot password" subtitle="The response is the same whether or not the email is registered.">
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
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Sending…" : "Send reset code"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        Back to {" "}
        <Link className="text-harvest" href="/login">
          Login
        </Link>
      </p>
    </AuthCard>
  );
}
