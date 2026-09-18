"use client";

export const runtime = 'edge';


import { FormEvent, use, useCallback, useEffect, useState } from "react";
import { Protected } from "@/components/app/protected";
import { PageHeader, Alert, Card, ErrorState, LoadingState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/field";
import { StatusBadge } from "@/components/ui/status-badge";
import { ordersApi } from "@/lib/api/orders";
import { ApiError, toUserMessage } from "@/lib/api/client";
import type { Order } from "@/lib/api/types";
import { ADMIN_TARGET_STATUSES } from "@/lib/constants";
import { formatDateTime, formatNgn } from "@/lib/utils";
import { useToast } from "@/lib/toast"; 


function AdminOrderInner({ id }: { id: string }) {
  const toast = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<(typeof ADMIN_TARGET_STATUSES)[number]>("received");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    ordersApi
      .adminGet(id)
      .then(setOrder)
      .catch((err) => setError(toUserMessage(err, "Unable to load order.")));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const updated = await ordersApi.updateStatus(id, status, note || undefined);
      setOrder(updated);
      setNote("");
      toast.push("Status updated");
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;
      if (apiError?.statusCode === 409) {
        setError("This order has already been updated. Refresh the page to see the latest status.");
        load();
      } else {
        setError(toUserMessage(err, "Unable to update status."));
      }
    } finally {
      setBusy(false);
    }
  }

  async function markDelivered() {
    setBusy(true);
    setError("");
    try {
      const updated = await ordersApi.markDelivered(id);
      setOrder(updated);
      toast.push("Marked delivered");
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;
      if (apiError?.statusCode === 409) {
        setError("This order has already been updated. Refresh the page to see the latest status.");
        load();
      } else {
        setError(toUserMessage(err, "Unable to mark delivered."));
      }
    } finally {
      setBusy(false);
    }
  }

  if (!order && !error) return <LoadingState />;
  if (error && !order) return <ErrorState message={error} onRetry={load} />;
  if (!order) return null;

  return (
    <>
      <PageHeader title="Fulfill order" description={`Admin cannot set pending or cancelled. ${formatDateTime(order.createdAt)}`} />
      {error ? <Alert tone="error">{error}</Alert> : null}
      <div className="mb-4 flex flex-wrap gap-2">
        <StatusBadge status={order.status} />
        <StatusBadge status={order.isPaid ? "paid" : "unpaid"} />
        <span className="text-sm">{formatNgn(order.totalPrice)}</span>
      </div>
      <Card className="mb-6 p-5">
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Next status">
            <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} disabled={busy}>
              {ADMIN_TARGET_STATUSES.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </Select>
          </Field>
          <Field label="Note (optional)">
            <Textarea value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} disabled={busy} />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Update status"}</Button>
            <Button type="button" variant="secondary" disabled={busy} onClick={markDelivered}>
              Mark delivered
            </Button>
          </div>
        </form>
      </Card>
      <div className="space-y-3">
        {order.items?.map((item, index) => (
          <Card key={`${item.file.publicId}-${index}`} className="p-4 text-sm">
            <p className="font-medium break-words">{item.file.fileName}</p>
            <p className="text-muted">{item.file.pages} pages · {item.quantity} copies</p>
          </Card>
        ))}
      </div>
    </>
  );
}


export default function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Protected admin>
      <AdminOrderInner id={id} />
    </Protected>
  );
}
