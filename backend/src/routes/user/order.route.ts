import express from "express";
import {
  createOrder,
  getUserOrders,
  findOrderById,
  calculateOrderPrice,
  cancelOrder,
} from "../../controllers/order.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middlewares/validate.middleware.js";
import { objectIdParamSchema } from "../../validations/common.schema.js";
import {
  calculateMultiItemPriceBodySchema,
  cancelOrderBodySchema,
  createOrderBodySchema,
  userOrdersQuerySchema,
} from "../../validations/order.schema.js";

const router = express.Router();

router.use(authenticate);

router.post("/", validateBody(createOrderBodySchema), createOrder);
router.get("/", validateQuery(userOrdersQuerySchema), getUserOrders);
router.post(
  "/calculate-price",
  validateBody(calculateMultiItemPriceBodySchema),
  calculateOrderPrice
);
router.post(
  "/:id/cancel",
  validateParams(objectIdParamSchema),
  validateBody(cancelOrderBodySchema),
  cancelOrder
);
router.get("/:id", validateParams(objectIdParamSchema), findOrderById);

export default router;
