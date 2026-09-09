"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Protected } from "@/components/app/protected";
import { PageHeader, Alert, LoadingState, Card } from "@/components/ui/card";
import { paymentsApi } from "@/lib/api/payments";
import { toUserMessage } from "@/lib/api/client";
import type { Order } from "@/lib/api/types";
import { formatNgn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";

function VerifyInner() {
  const params = useSearchParams();
  const reference = params.get("reference") || params.get("trxref") || "";
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reference) {
      setError("Payment was not completed. If you cancelled checkout, return to the order and try again.");
      setLoading(false);
      return;
    }
    paymentsApi
      .verify(reference)
      .then((result) => setOrder(result.order))
      .catch((err) => {
        const message = toUserMessage(err, "Unable to verify payment.");
        if (/payment verification failed/i.test(message)) {
          setError("Payment was not completed. You can return to the order and try again.");
          return;
        }
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [reference]);

  return (
    <>
      <PageHeader title="Payment verification" description="The backend re-checks Paystack. Amount and currency cannot be changed here." />
      {loading ? <LoadingState /> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}
      {order ? (
        <Card className="max-w-lg space-y-3 p-5">
          <p className="font-medium">
            {order.isPaid ? "Payment recorded" : "This order is not marked as paid yet."}
          </p>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={order.isPaid ? "paid" : "unpaid"} />
            <StatusBadge status={order.status} />
          </div>
          <p className="text-sm text-muted">{formatNgn(order.totalPrice)}</p>
          <Link className="text-sm text-harvest" href={`/orders/${order._id}`}>
            Open order
          </Link>
        </Card>
      ) : null}
    </>
  );
}

export default function PaymentVerifyPage() {
  return (
    <Protected>
      <Suspense fallback={<LoadingState />}>
        <VerifyInner />
      </Suspense>
    </Protected>
  );
}
