"use client";

export const runtime = 'edge';

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Protected } from "@/components/app/protected";
import { PageHeader, Card, ErrorState, LoadingState } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { transactionsApi } from "@/lib/api/payments";
import { toUserMessage } from "@/lib/api/client";
import type { Transaction } from "@/lib/api/types";
import { formatDateTime, formatId, formatNgn, resourceId } from "@/lib/utils";

function Detail({ id }: { id: string }) {
  const [tx, setTx] = useState<Transaction | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setError("");
    transactionsApi
      .getMine(id)
      .then(setTx)
      .catch((err) => setError(toUserMessage(err, "Unable to load transaction.")));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (error && !tx) return <ErrorState message={error} onRetry={load} />;
  if (!tx) return <LoadingState />;

  const orderId = resourceId(tx.order);

  return (
    <>
      <PageHeader title="Transaction" description={tx.reference} />
      <Card className="space-y-3 p-5 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted">Amount</span>
          <span>{formatNgn(tx.amount)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted">Status</span>
          <StatusBadge status={tx.status} />
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted">Currency</span>
          <span>{tx.currency}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted">Created</span>
          <span>{formatDateTime(tx.createdAt)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted">Paid at</span>
          <span>{formatDateTime(tx.paidAt)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted">ID</span>
          <span className="break-all">{formatId(tx._id)}</span>
        </div>
        {orderId ? (
          <p>
            <Link className="text-harvest" href={`/orders/${orderId}`}>
              View related order
            </Link>
          </p>
        ) : null}
      </Card>
    </>
  );
}

export default function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Protected>
      <Detail id={id} />
    </Protected>
  );
}
