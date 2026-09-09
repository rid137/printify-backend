"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Protected } from "@/components/app/protected";
import { PageHeader, Card, EmptyState, LoadingState, ErrorState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ordersApi } from "@/lib/api/orders";
import { transactionsApi } from "@/lib/api/payments";
import type { Order, Transaction } from "@/lib/api/types";
import { formatDateTime, formatNgn } from "@/lib/utils";
import { toUserMessage } from "@/lib/api/client";

function DashboardInner() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      ordersApi.listMine({ page: 1, size: 5 }),
      transactionsApi.listMine({ page: 1, size: 5 }),
    ])
      .then(([orderPage, txPage]) => {
        setOrders(orderPage.documents);
        setTransactions(txPage.documents);
        setError("");
      })
      .catch((err) => setError(toUserMessage(err, "Unable to load dashboard.")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unpaid = orders.filter((order) => !order.isPaid && order.status === "pending").length;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Recent orders and payments from your account."
        action={
          <Link href="/orders/new">
            <Button>New order</Button>
          </Link>
        }
      />
      {error && !loading && orders.length === 0 && transactions.length === 0 ? (
        <ErrorState message={error} onRetry={load} />
      ) : null}
      {loading ? <LoadingState /> : error && orders.length === 0 && transactions.length === 0 ? null : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-4">
              <p className="text-sm text-muted">Recent orders (this page)</p>
              <p className="mt-2 text-2xl font-semibold">{orders.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted">Awaiting payment (this page)</p>
              <p className="mt-2 text-2xl font-semibold">{unpaid}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted">Recent transactions (this page)</p>
              <p className="mt-2 text-2xl font-semibold">{transactions.length}</p>
            </Card>
          </div>
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="font-medium">Latest orders</h2>
              <Link href="/orders" className="text-sm text-harvest">View all</Link>
            </div>
            {orders.length === 0 ? (
              <div className="p-4">
                <EmptyState title="No orders yet" description="Upload a document to create your first print order." action={<Link href="/orders/new"><Button>Create order</Button></Link>} />
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {orders.map((order) => (
                  <li key={order._id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                    <Link href={`/orders/${order._id}`} className="min-w-0 font-medium break-words hover:text-harvest">
                      {order.items?.[0]?.file.fileName || "Order"} · {formatNgn(order.totalPrice)}
                    </Link>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={order.status} />
                      <StatusBadge status={order.isPaid ? "paid" : "unpaid"} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="font-medium">Latest transactions</h2>
              <Link href="/transactions" className="text-sm text-harvest">View all</Link>
            </div>
            {transactions.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted">No transactions yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {transactions.map((tx) => (
                  <li key={tx._id} className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm">
                    <Link href={`/transactions/${tx._id}`} className="hover:text-harvest">
                      {formatNgn(tx.amount)} · {formatDateTime(tx.createdAt)}
                    </Link>
                    <StatusBadge status={tx.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </>
  );
}

export default function DashboardPage() {
  return (
    <Protected>
      <DashboardInner />
    </Protected>
  );
}
