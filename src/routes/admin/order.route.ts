import express from "express";
import {
  getAllOrders,
  countTotalOrders,
  markOrderAsDelivered,
  calculateTotalSales,
} from "../../controllers/order.controller.js";
import { authenticate, authorizeAdmin } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticate, authorizeAdmin);

router.get("/", getAllOrders);
router.get("/count", countTotalOrders);
router.route("/total-sales").get(calculateTotalSales);
router.put("/:id/deliver", markOrderAsDelivered);

export default router;