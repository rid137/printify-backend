"use client";

import { FormEvent, useEffect, useState } from "react";
import { Protected } from "@/components/app/protected";
import { PageHeader, Alert, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { usersApi } from "@/lib/api/users";
import { toUserMessage } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";

function ProfileInner() {
  const { user, setSession, token } = useAuth();
  const toast = useToast();
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
    }
  }, [user]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const updated = await usersApi.updateProfile({ username, email });
      if (token) setSession({ ...updated, accessToken: token });
      toast.push("Profile updated");
    } catch (err) {
      setError(toUserMessage(err, "Unable to update profile."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Profile" description="Update the name and email on your account." />
      <Card className="max-w-lg p-5">
        <form onSubmit={onSubmit} className="space-y-4">
          {error ? <Alert tone="error">{error}</Alert> : null}
          <Field label="Username" htmlFor="username">
            <Input id="username" required value={username} onChange={(e) => setUsername(e.target.value)} />
          </Field>
          <Field label="Email" htmlFor="email">
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <p className="text-sm text-subtle">Role: {user?.role}</p>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </Button>
        </form>
      </Card>
    </>
  );
}

export default function ProfilePage() {
  return (
    <Protected>
      <ProfileInner />
    </Protected>
  );
}
