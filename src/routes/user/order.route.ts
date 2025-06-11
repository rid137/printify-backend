import express from "express";
import {
  createOrder,
  getUserOrders,
  findOrderById,
  markOrderAsPaid,
  calculateOrderPrice
} from "../../controllers/order.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticate);

router.post("/", createOrder);
router.get("/", getUserOrders);
router.post("/calculate-price", calculateOrderPrice);
router.get("/:id", findOrderById);
router.put("/:id/pay", markOrderAsPaid);

export default router;