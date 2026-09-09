import { cn } from "@/lib/utils";
import type { OrderStatus, TransactionStatus } from "@/lib/api/types";

const orderLabels: Record<OrderStatus, string> = {
  pending: "Pending",
  received: "Received",
  processing: "Processing",
  completed: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function StatusBadge({
  status,
}: {
  status: OrderStatus | TransactionStatus | "paid" | "unpaid";
}) {
  const label =
    status in orderLabels
      ? orderLabels[status as OrderStatus]
      : status === "success"
        ? "Success"
        : status === "paid"
          ? "Paid"
          : status === "unpaid"
            ? "Unpaid"
            : status;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-sm)] px-2 py-0.5 text-xs font-medium capitalize",
        (status === "pending" || status === "unpaid") && "bg-surface-muted text-muted",
        (status === "received" || status === "processing") && "bg-marigold/60 text-ink dark:bg-harvest/20 dark:text-marigold",
        (status === "completed" || status === "delivered" || status === "success" || status === "paid") &&
          "bg-harvest/15 text-harvest",
        status === "cancelled" && "bg-line text-muted"
      )}
    >
      {label}
    </span>
  );
}
