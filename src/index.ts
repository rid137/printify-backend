import express from "express";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.route.js";
import logger from "./middlewares/logger.middleware.js";
import swaggerDocs from "./utils/swagger.js";
import errorHandler from "./middlewares/error-handler.middleware.js";

import notificationRoutes from "./routes/notification.route.js";
import uploadRoute from "./routes/upload.route.js";
import userOrderRoutes from "./routes/user/order.route.js";
import adminOrderRoutes from "./routes/admin/order.route.js";
import adminUserRoutes from "./routes/admin/user.route.js";
import userRoutes from "./routes/user/user.route.js";
import paymentRoutes from "./routes/payment.route.js";
import adminTransactionRoutes from "./routes/admin/transaction.route.js";
import userTransactionRoutes from "./routes/user/transaction.route.js";

dotenv.config();
const port: string | number = process.env.PORT || 8080;

connectDB();

const app = express();

// JSON parsing middleware
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// Logger middleware
app.use(logger)

app.use("/api/auth", authRoutes);
app.use("/api/notification", notificationRoutes);
app.use("/api/upload", uploadRoute);

app.use("/api/admin", adminUserRoutes);
app.use("/api/user", userRoutes);

app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/user/orders", userOrderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin/transactions", adminTransactionRoutes);
app.use("/api/user/transactions", userTransactionRoutes);

app.use(errorHandler);

// Initialize swagger docs
swaggerDocs(app, port as number);

app.listen(port, () => console.log(`Server running on port: ${port}`));