"use client";

export const runtime = 'edge';

import { use, useCallback, useEffect, useState } from "react";
import { Protected } from "@/components/app/protected";
import { PageHeader, Alert, Card, ErrorState, LoadingState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ordersApi } from "@/lib/api/orders";
import { paymentsApi } from "@/lib/api/payments";
import { ApiError, toUserMessage } from "@/lib/api/client";
import type { Order } from "@/lib/api/types";
import { formatDateTime, formatId, formatNgn } from "@/lib/utils";
import { useToast } from "@/lib/toast";

function OrderDetailInner({ id }: { id: string }) {
  const toast = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const load = useCallback(() => {
    setError("");
    ordersApi
      .getMine(id)
      .then(setOrder)
      .catch((err) => setError(toUserMessage(err, "Unable to load order.")));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function pay() {
    setBusy(true);
    try {
      const init = await paymentsApi.initialize(id);
      if (init.authorization_url) {
        window.location.href = init.authorization_url;
        return;
      }
      toast.push("Payment could not be started. Try again.", "err");
    } catch (err) {
      toast.push(toUserMessage(err, "Unable to start payment."), "err");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    setBusy(true);
    try {
      const updated = await ordersApi.cancel(id);
      setOrder(updated);
      setConfirmCancel(false);
      toast.push("Order cancelled");
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;
      if (apiError?.statusCode === 409) {
        toast.push("This order has already been updated. Refresh the page to see the latest status.", "err");
        load();
      } else {
        toast.push(toUserMessage(err, "Unable to cancel."), "err");
      }
    } finally {
      setBusy(false);
    }
  }

  if (error && !order) {
    return <ErrorState message={error} onRetry={load} />;
  }
  if (!order) return <LoadingState />;

  const canPay = order.status === "pending" && !order.isPaid;
  const canCancel = canPay;

  return (
    <>
      <PageHeader
        title={order.items?.[0]?.file.fileName || "Order"}
        description={`Created ${formatDateTime(order.createdAt)} · ${formatId(order._id)}`}
        action={
          <div className="flex flex-wrap gap-2">
            {canPay ? (
              <Button onClick={pay} disabled={busy}>
                {busy ? "Starting…" : "Pay now"}
              </Button>
            ) : null}
            {canCancel ? (
              <Button variant="secondary" onClick={() => setConfirmCancel(true)} disabled={busy}>
                Cancel order
              </Button>
            ) : null}
          </div>
        }
      />
      {error ? <Alert tone="error">{error}</Alert> : null}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={order.status} />
        <StatusBadge status={order.isPaid ? "paid" : "unpaid"} />
        <span className="text-sm text-muted">{formatNgn(order.totalPrice)}</span>
      </div>
      <div className="space-y-4">
        {order.items?.map((item, index) => (
          <Card key={`${item.file.publicId}-${index}`} className="p-4 text-sm">
            <p className="font-medium break-words">{item.file.fileName}</p>
            <p className="mt-1 text-muted">
              {item.file.pages} pages · {item.quantity} copies · {item.printingOptions.color} ·{" "}
              {item.printingOptions.paperSize} {item.printingOptions.paperType} · {item.printingOptions.finishing}
            </p>
            <p className="mt-2">{formatNgn(item.subtotal)}</p>
          </Card>
        ))}
      </div>
      {order.statusHistory?.length ? (
        <ol className="mt-8 space-y-2 text-sm">
          {order.statusHistory.map((entry, index) => (
            <li key={`${entry.status}-${index}`} className="text-muted">
              {entry.status} · {formatDateTime(entry.at)}
              {entry.note ? ` · ${entry.note}` : ""}
            </li>
          ))}
        </ol>
      ) : null}
      <ConfirmDialog
        open={confirmCancel}
        title="Cancel this order?"
        description="Only unpaid pending orders can be cancelled. This cannot be undone."
        confirmLabel="Cancel order"
        danger
        busy={busy}
        onClose={() => setConfirmCancel(false)}
        onConfirm={cancel}
      />
    </>
  );
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Protected>
      <OrderDetailInner id={id} />
    </Protected>
  );
}
