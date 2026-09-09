"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Protected } from "@/components/app/protected";
import { PageHeader, Card, Alert, ErrorState, LoadingState } from "@/components/ui/card";
import { ordersApi } from "@/lib/api/orders";
import { toUserMessage } from "@/lib/api/client";
import { formatNgn } from "@/lib/utils";

function AdminHomeInner() {
  const [sales, setSales] = useState<number | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([ordersApi.totalSales(), ordersApi.count()])
      .then(([salesResult, countResult]) => {
        setSales(salesResult.totalSales);
        setCount(countResult.totalOrders);
        setError("");
      })
      .catch((err) => setError(toUserMessage(err, "Unable to load admin metrics.")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader title="Admin" description="Figures come from paid orders and the order collection — nothing is invented." />
      {error && sales == null && count == null && !loading ? <ErrorState message={error} onRetry={load} /> : null}
      {error && (sales != null || count != null) ? <Alert tone="error">{error}</Alert> : null}
      {loading ? <LoadingState /> : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-5">
            <p className="text-sm text-muted">Total sales (paid orders)</p>
            <p className="mt-2 text-3xl font-semibold">{sales == null ? "—" : formatNgn(sales)}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-muted">Orders in the system</p>
            <p className="mt-2 text-3xl font-semibold">{count ?? "—"}</p>
          </Card>
        </div>
      )}
      <div className="mt-8 flex flex-wrap gap-4 text-sm">
        <Link className="text-harvest" href="/admin/orders">Manage orders</Link>
        <Link className="text-harvest" href="/admin/users">Users</Link>
        <Link className="text-harvest" href="/admin/transactions">Transactions</Link>
        <Link className="text-harvest" href="/admin/pricing">Pricing rules</Link>
      </div>
    </>
  );
}

export default function AdminPage() {
  return (
    <Protected admin>
      <AdminHomeInner />
    </Protected>
  );
}
