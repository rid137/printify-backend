import asyncHandler from "../middlewares/async-handler.middleware.js";
import {
  createdResponse,
  paginatedResponse,
  successResponse,
} from "../utils/apiResponse.js";
import { OrderService } from "../services/order.service.js";
import type {
  AdminOrdersQuery,
  CalculateMultiItemPriceBody,
  CancelOrderBody,
  CreateOrderBody,
  UpdateOrderStatusBody,
  UserOrdersQuery,
} from "../validations/order.schema.js";

const calculateOrderPrice = asyncHandler(async (req, res) => {
  const data = await OrderService.calculateMultiItemPrice(
    req.user._id,
    req.body as CalculateMultiItemPriceBody
  );
  createdResponse(res, data, "Price calculated successfully");
});

const createOrder = asyncHandler(async (req, res) => {
  const createdOrder = await OrderService.createOrder(
    req.user._id,
    req.body as CreateOrderBody
  );
  createdResponse(res, createdOrder, "Order created successfully");
});

const getAllOrders = asyncHandler(async (req, res) => {
  const { orders, meta } = await OrderService.getAllOrders(
    req.query as unknown as AdminOrdersQuery
  );
  paginatedResponse(res, orders, meta, "Orders retrieved successfully");
});

const getUserOrders = asyncHandler(async (req, res) => {
  const { orders, meta } = await OrderService.getUserOrders(
    req.user._id,
    req.query as unknown as UserOrdersQuery
  );
  paginatedResponse(res, orders, meta, "User orders retrieved successfully");
});

const countTotalOrders = asyncHandler(async (_req, res) => {
  const data = await OrderService.countTotalOrders();
  successResponse(res, data, "Total orders count retrieved");
});

const findOrderById = asyncHandler(async (req, res) => {
  const order = await OrderService.findOrderByIdForUser(
    req.params.id,
    req.user._id
  );
  successResponse(res, order, "Order retrieved successfully");
});

const findAdminOrderById = asyncHandler(async (req, res) => {
  const order = await OrderService.findOrderByIdForAdmin(req.params.id);
  successResponse(res, order, "Order retrieved successfully");
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body as UpdateOrderStatusBody;
  const updatedOrder = await OrderService.transitionStatus(
    req.params.id,
    status,
    req.user._id,
    { actor: "admin", note }
  );
  successResponse(res, updatedOrder, "Order status updated");
});

const cancelOrder = asyncHandler(async (req, res) => {
  const { note } = (req.body || {}) as CancelOrderBody;
  const updatedOrder = await OrderService.cancelOrder(
    req.params.id,
    req.user._id,
    note
  );
  successResponse(res, updatedOrder, "Order cancelled");
});

const markOrderAsDelivered = asyncHandler(async (req, res) => {
  const updatedOrder = await OrderService.markOrderAsDelivered(
    req.params.id,
    req.user._id
  );
  successResponse(res, updatedOrder, "Order marked as delivered");
});

const calculateTotalSales = asyncHandler(async (_req, res) => {
  const data = await OrderService.calculateTotalSales();
  successResponse(res, data, "Total sales calculated");
});

export {
  calculateOrderPrice,
  createOrder,
  getAllOrders,
  getUserOrders,
  countTotalOrders,
  calculateTotalSales,
  findOrderById,
  findAdminOrderById,
  updateOrderStatus,
  cancelOrder,
  markOrderAsDelivered,
};
