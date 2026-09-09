import express from "express";
import {
  getAllOrders,
  countTotalOrders,
  markOrderAsDelivered,
  calculateTotalSales,
  findAdminOrderById,
  updateOrderStatus,
} from "../../controllers/order.controller.js";
import {
  authenticate,
  authorizeAdmin,
} from "../../middlewares/auth.middleware.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middlewares/validate.middleware.js";
import { objectIdParamSchema } from "../../validations/common.schema.js";
import {
  adminOrdersQuerySchema,
  updateOrderStatusBodySchema,
} from "../../validations/order.schema.js";

const router = express.Router();

router.use(authenticate, authorizeAdmin);

router.get("/", validateQuery(adminOrdersQuerySchema), getAllOrders);
router.get("/count", countTotalOrders);
router.get("/total-sales", calculateTotalSales);
router.get("/:id", validateParams(objectIdParamSchema), findAdminOrderById);
router.put(
  "/:id/status",
  validateParams(objectIdParamSchema),
  validateBody(updateOrderStatusBodySchema),
  updateOrderStatus
);
router.put(
  "/:id/deliver",
  validateParams(objectIdParamSchema),
  markOrderAsDelivered
);

export default router;
