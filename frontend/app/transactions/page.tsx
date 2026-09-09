"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Protected } from "@/components/app/protected";
import { PageHeader, EmptyState, LoadingState, Alert, ErrorState } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { transactionsApi } from "@/lib/api/payments";
import { toUserMessage } from "@/lib/api/client";
import type { PaginationMeta, Transaction } from "@/lib/api/types";
import { formatDateTime, formatNgn } from "@/lib/utils";

function TransactionsInner() {
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Transaction[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    transactionsApi
      .listMine({ page, size: 20 })
      .then((result) => {
        setRows(result.documents);
        setMeta(result.meta);
        setError("");
      })
      .catch((err) => setError(toUserMessage(err, "Unable to load transactions.")))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader title="Transactions" description="Payments tied to your orders. Status is pending or success." />
      {error && rows.length === 0 && !loading ? <ErrorState message={error} onRetry={load} /> : null}
      {error && rows.length > 0 ? <Alert tone="error">{error}</Alert> : null}
      {loading && rows.length === 0 ? (
        <LoadingState />
      ) : !error && rows.length === 0 ? (
        <EmptyState title="No transactions" description="Transactions appear after you initialize payment on an order." />
      ) : rows.length > 0 ? (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-line bg-surface">
          <table className="min-w-[36rem] text-left text-sm">
            <thead className="border-b border-line text-subtle">
              <tr>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row._id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <Link className="break-all hover:text-harvest" href={`/transactions/${row._id}`}>
                      {row.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatNgn(row.amount)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted">{formatDateTime(row.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {meta ? <Pagination meta={meta} onPage={setPage} /> : null}
    </>
  );
}

export default function TransactionsPage() {
  return (
    <Protected>
      <TransactionsInner />
    </Protected>
  );
}
