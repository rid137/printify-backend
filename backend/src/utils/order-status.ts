import {
  ORDER_STATUSES,
  type OrderStatus,
} from "../types/order.types.js";

export { ORDER_STATUSES };

/** Admin fulfillment targets. Cancellation is owner-only via POST .../cancel. */
export const ADMIN_TARGET_STATUSES = [
  "received",
  "processing",
  "completed",
  "delivered",
] as const satisfies readonly OrderStatus[];

const LEGACY_STATUS_MAP: Record<string, OrderStatus> = {
  pending: "pending",
  received: "received",
  processing: "processing",
  completed: "completed",
  delivered: "delivered",
  cancelled: "cancelled",
  printed: "completed",
  shipped: "completed",
};

/**
 * Forward-only machine. `pending → cancelled` is owner-only (dedicated cancel API).
 * Payment confirmation does not advance status — admin marks received.
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["received", "cancelled"],
  received: ["processing"],
  processing: ["completed"],
  completed: ["delivered"],
  delivered: [],
  cancelled: [],
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  received: "Received",
  processing: "Processing",
  completed: "Ready for pickup",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const isOrderStatus = (value: unknown): value is OrderStatus =>
  typeof value === "string" &&
  (ORDER_STATUSES as readonly string[]).includes(value);

export type OrderStatusSource = {
  status?: string;
  isPaid?: boolean;
  isDelivered?: boolean;
};

/**
 * Authoritative status for reads and transitions.
 * Uses persisted `status` (plus printed/shipped aliases). Does not let
 * `isDelivered` override a stored status such as processing or completed.
 */
export const inferOrderStatus = (order: OrderStatusSource): OrderStatus => {
  const raw = (order.status || "").trim().toLowerCase();
  if (isOrderStatus(raw)) {
    return raw;
  }
  if (raw && LEGACY_STATUS_MAP[raw]) {
    return LEGACY_STATUS_MAP[raw];
  }
  return "pending";
};

/**
 * Legacy documents used `isDelivered` as the delivered flag while leaving
 * status as pending. Migration may map that once; API reads must not.
 */
export const canonicalStatusForMigration = (
  order: OrderStatusSource
): OrderStatus => {
  if (order.isDelivered) {
    return "delivered";
  }
  return inferOrderStatus(order);
};

export const isDeliveredForStatus = (status: OrderStatus): boolean =>
  status === "delivered";

export type StatusTransitionActor = "admin" | "user";

export type StatusTransitionContext = {
  isPaid: boolean;
  actor: StatusTransitionActor;
};

export type TransitionCheck =
  | { ok: true }
  | { ok: false; reason: string };

export const canTransition = (
  from: OrderStatus,
  to: OrderStatus,
  ctx: StatusTransitionContext
): TransitionCheck => {
  if (from === to) {
    return {
      ok: false,
      reason: `Order is already ${from}`,
    };
  }

  if (ctx.actor === "user" && to !== "cancelled") {
    return {
      ok: false,
      reason: "Only administrators can update order status",
    };
  }

  if (ctx.actor === "admin" && to === "cancelled") {
    return {
      ok: false,
      reason: "Orders can only be cancelled by the owner",
    };
  }

  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    return {
      ok: false,
      reason: `Cannot transition from ${from} to ${to}`,
    };
  }

  if (from === "pending" && to === "received" && !ctx.isPaid) {
    return {
      ok: false,
      reason: "Order must be paid before it can be marked as received",
    };
  }

  if (to === "cancelled" && ctx.isPaid) {
    return {
      ok: false,
      reason: "Paid orders cannot be cancelled",
    };
  }

  return { ok: true };
};

export const deliveryFieldsForStatus = (
  status: OrderStatus,
  at: Date
): { isDelivered: boolean; deliveredAt?: Date } => {
  if (status === "delivered") {
    return { isDelivered: true, deliveredAt: at };
  }
  return { isDelivered: false };
};

/**
 * Atomic Mongo predicate for a status write. Includes expected current status
 * so a stale concurrent transition cannot skip the machine.
 */
export const statusTransitionFilter = (
  orderId: unknown,
  from: OrderStatus,
  to: OrderStatus
): Record<string, unknown> => {
  const filter: Record<string, unknown> = {
    _id: orderId,
    status: from,
  };

  if (to === "cancelled") {
    filter.isPaid = false;
  }

  if (to === "received") {
    filter.isPaid = true;
  }

  return filter;
};

export const isEligibleForPayment = (order: OrderStatusSource): boolean => {
  const status = inferOrderStatus(order);
  return status === "pending" && order.isPaid !== true;
};

/** Atomic predicate: cancelled / non-pending orders cannot become paid. */
export const paymentConfirmationFilter = (
  orderId: unknown
): Record<string, unknown> => ({
  _id: orderId,
  isPaid: false,
  status: "pending",
});

export const statusQueryFilter = (
  status: OrderStatus
): Record<string, unknown> => {
  if (status === "completed") {
    return { status: { $in: ["completed", "printed", "shipped"] } };
  }

  if (status === "pending") {
    return { status: { $in: ["pending", null] } };
  }

  return { status };
};
