"use client";

import { FormEvent, useState } from "react";
import { Protected } from "@/components/app/protected";
import { PageHeader, Alert, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { notificationsApi } from "@/lib/api/notifications";
import { ApiError, toUserMessage } from "@/lib/api/client";
import { MAX_FCM_TOKEN_LENGTH } from "@/lib/constants";
import { useToast } from "@/lib/toast";

function NotificationsInner() {
  const toast = useToast();
  const [fcmToken, setFcmToken] = useState("");
  const [platform, setPlatform] = useState<"web" | "android" | "ios">("web");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function register(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await notificationsApi.registerDevice({ fcmToken, platform });
      toast.push("Device registered");
    } catch (err) {
      setError(toUserMessage(err, "Unable to register device."));
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    setError("");
    try {
      await notificationsApi.sendTest();
      toast.push("Test notification sent");
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;
      if (apiError?.statusCode === 500) {
        setError(
          "Push notifications are not available on this server. The rest of the app still works."
        );
      } else {
        setError(toUserMessage(err, "Unable to send a test notification."));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Firebase is optional. The API can run without FCM; test sends will fail until it is configured."
      />
      <Card className="max-w-xl space-y-6 p-5">
        {error ? <Alert tone="error">{error}</Alert> : null}
        <form onSubmit={register} className="space-y-4">
          <Field label="FCM token" htmlFor="token" hint={`Max ${MAX_FCM_TOKEN_LENGTH} characters`}>
            <Input
              id="token"
              required
              maxLength={MAX_FCM_TOKEN_LENGTH}
              value={fcmToken}
              onChange={(e) => setFcmToken(e.target.value)}
            />
          </Field>
          <Field label="Platform">
            <Select value={platform} onChange={(e) => setPlatform(e.target.value as typeof platform)}>
              <option value="web">Web</option>
              <option value="android">Android</option>
              <option value="ios">iOS</option>
            </Select>
          </Field>
          <Button type="submit" disabled={busy}>
            {busy ? "Registering…" : "Register device"}
          </Button>
        </form>
        <Button variant="secondary" onClick={sendTest} disabled={busy}>
          {busy ? "Sending…" : "Send test notification"}
        </Button>
      </Card>
    </>
  );
}

export default function NotificationsPage() {
  return (
    <Protected>
      <NotificationsInner />
    </Protected>
  );
}
