"use client";

import { useCallback, useEffect, useState } from "react";
import { Protected } from "@/components/app/protected";
import { PageHeader, EmptyState, LoadingState, Alert, ErrorState } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { transactionsApi } from "@/lib/api/payments";
import { toUserMessage } from "@/lib/api/client";
import type { PaginationMeta, Transaction, TransactionStatus } from "@/lib/api/types";
import { TRANSACTION_STATUSES } from "@/lib/constants";
import { formatDateTime, formatNgn } from "@/lib/utils";
import { useToast } from "@/lib/toast";

function AdminTransactionsInner() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<TransactionStatus | "">("");
  const [rows, setRows] = useState<Transaction[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    transactionsApi
      .adminList({ page, size: 10, status: status || undefined })
      .then((result) => {
        setRows(result.documents);
        setMeta(result.meta);
        setError("");
      })
      .catch((err) => setError(toUserMessage(err, "Unable to load transactions.")))
      .finally(() => setLoading(false));
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove() {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await transactionsApi.adminRemove(pendingDelete);
      toast.push("Transaction deleted");
      setPendingDelete(null);
      load();
    } catch (err) {
      setError(toUserMessage(err, "Unable to delete transaction."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Transactions" description="Filter by pending or success only. Regex filters are not accepted." />
      <div className="mb-4 max-w-xs">
        <Select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value as TransactionStatus | "");
          }}
          aria-label="Status"
        >
          <option value="">All</option>
          {TRANSACTION_STATUSES.map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </Select>
      </div>
      {error && rows.length === 0 && !loading ? <ErrorState message={error} onRetry={load} /> : null}
      {error && rows.length > 0 ? <Alert tone="error">{error}</Alert> : null}
      {loading && rows.length === 0 ? (
        <LoadingState />
      ) : !error && rows.length === 0 ? (
        <EmptyState title="No transactions" description="Payments will appear here after initialization." />
      ) : rows.length > 0 ? (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-line bg-surface">
          <table className="min-w-[40rem] text-left text-sm">
            <thead className="border-b border-line text-subtle">
              <tr>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row._id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 break-all">{row.reference}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatNgn(row.amount)}</td>
                  <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted">{formatDateTime(row.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" onClick={() => setPendingDelete(row._id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {meta ? <Pagination meta={meta} onPage={setPage} /> : null}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete transaction?"
        description="This removes the payment record. It does not refund Paystack."
        confirmLabel="Delete"
        danger
        busy={busy}
        onClose={() => setPendingDelete(null)}
        onConfirm={remove}
      />
    </>
  );
}

export default function AdminTransactionsPage() {
  return (
    <Protected admin>
      <AdminTransactionsInner />
    </Protected>
  );
}
