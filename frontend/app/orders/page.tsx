"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Protected } from "@/components/app/protected";
import { PageHeader, EmptyState, LoadingState, Alert, ErrorState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { Select } from "@/components/ui/field";
import { ordersApi } from "@/lib/api/orders";
import { toUserMessage } from "@/lib/api/client";
import type { Order, OrderStatus, PaginationMeta } from "@/lib/api/types";
import { ORDER_STATUSES } from "@/lib/constants";
import { formatDateTime, formatNgn } from "@/lib/utils";

function OrdersInner() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    ordersApi
      .listMine({ page, size: 20, status: status || undefined })
      .then((result) => {
        setOrders(result.documents);
        setMeta(result.meta);
        setError("");
      })
      .catch((err) => setError(toUserMessage(err, "Unable to load orders.")))
      .finally(() => setLoading(false));
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader
        title="Orders"
        description="Your print jobs, payment state, and fulfillment status."
        action={
          <Link href="/orders/new">
            <Button>New order</Button>
          </Link>
        }
      />
      <div className="mb-4 max-w-xs">
        <Select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value as OrderStatus | "");
          }}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
      </div>
      {error && orders.length === 0 && !loading ? (
        <ErrorState message={error} onRetry={load} />
      ) : null}
      {error && orders.length > 0 ? <Alert tone="error">{error}</Alert> : null}
      {loading && orders.length === 0 ? (
        <LoadingState />
      ) : !error && orders.length === 0 ? (
        <EmptyState
          title="No orders"
          description="Create an order from an uploaded document."
          action={
            <Link href="/orders/new">
              <Button>Create order</Button>
            </Link>
          }
        />
      ) : orders.length > 0 ? (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-line bg-surface">
          <table className="min-w-[40rem] text-left text-sm">
            <thead className="border-b border-line text-subtle">
              <tr>
                <th className="px-4 py-3 font-medium">File</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Paid</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <Link className="font-medium break-words hover:text-harvest" href={`/orders/${order._id}`}>
                      {order.items?.[0]?.file.fileName || "Order"}
                      {order.items?.length > 1 ? ` +${order.items.length - 1}` : ""}
                    </Link>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatNgn(order.totalPrice)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.isPaid ? "paid" : "unpaid"} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted">{formatDateTime(order.createdAt)}</td>
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

export default function OrdersPage() {
  return (
    <Protected>
      <OrdersInner />
    </Protected>
  );
}
