"use client";

export const runtime = 'edge';    

import { FormEvent, use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Protected } from "@/components/app/protected";
import { PageHeader, Alert, Card, ErrorState, LoadingState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { usersApi } from "@/lib/api/users";
import { toUserMessage } from "@/lib/api/client";
import type { User } from "@/lib/api/types";
import { useToast } from "@/lib/toast";



function UserInner({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const load = useCallback(() => {
    usersApi
      .get(id)
      .then((next) => {
        setUser(next);
        setUsername(next.username);
        setEmail(next.email);
        setRole(next.role);
        setError("");
      })
      .catch((err) => setError(toUserMessage(err, "Unable to load user.")));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!username.trim()) {
      setError("Username is required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const updated = await usersApi.update(id, { username: username.trim(), email: email.trim(), role });
      setUser(updated);
      toast.push("User updated");
    } catch (err) {
      setError(toUserMessage(err, "Unable to update user."));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await usersApi.remove(id);
      toast.push("User removed");
      router.push("/admin/users");
    } catch (err) {
      setError(toUserMessage(err, "Unable to delete user."));
      setConfirm(false);
    } finally {
      setBusy(false);
    }
  }

  if (!user && !error) return <LoadingState />;
  if (error && !user) return <ErrorState message={error} onRetry={load} />;
  if (!user) return null;

  return (
    <>
      <PageHeader title={user.username} description={user.email} />
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Card className="max-w-lg p-5">
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Username" htmlFor="username">
            <Input id="username" required value={username} onChange={(e) => setUsername(e.target.value)} disabled={busy} />
          </Field>
          <Field label="Email" htmlFor="email">
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} />
          </Field>
          <Field label="Role">
            <Select value={role} onChange={(e) => setRole(e.target.value as typeof role)} disabled={busy}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </Select>
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
            <Button type="button" variant="danger" disabled={busy || user.role === "admin"} onClick={() => setConfirm(true)}>
              Delete
            </Button>
          </div>
        </form>
      </Card>
      <ConfirmDialog
        open={confirm}
        title="Delete this user?"
        description="Admin accounts cannot be deleted."
        confirmLabel="Delete"
        danger
        busy={busy}
        onClose={() => setConfirm(false)}
        onConfirm={remove}
      />
    </>
  );
}



export default function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Protected admin>
      <UserInner id={id} />
    </Protected>
  );
}
