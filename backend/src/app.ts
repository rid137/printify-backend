import express from "express";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./routes/auth.route.js";
import logger from "./middlewares/logger.middleware.js";
import swaggerDocs from "./utils/swagger.js";
import errorHandler from "./middlewares/error-handler.middleware.js";
import {
  apiRateLimiter,
  webhookRateLimiter,
} from "./middlewares/rate-limit.middleware.js";
import { applyTrustProxy, getCorsOrigins } from "./config/secrets.js";

import notificationRoutes from "./routes/notification.route.js";
import uploadRoute from "./routes/upload.route.js";
import userOrderRoutes from "./routes/user/order.route.js";
import adminOrderRoutes from "./routes/admin/order.route.js";
import adminUserRoutes from "./routes/admin/user.route.js";
import userRoutes from "./routes/user/user.route.js";
import paymentRoutes from "./routes/payment.route.js";
import adminTransactionRoutes from "./routes/admin/transaction.route.js";
import userTransactionRoutes from "./routes/user/transaction.route.js";
import adminPricingRoutes from "./routes/admin/pricing.route.js";
import publicPricingRoutes from "./routes/pricing.route.js";
import { paystackWebhook } from "./controllers/payment.controller.js";

const createApp = () => {
  const app = express();
  const port = Number(process.env.PORT) || 8080;

  applyTrustProxy(app);

  const frontendOrigins = getCorsOrigins();

  app.use(
    cors({
      origin: frontendOrigins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "x-paystack-signature",
      ],
    })
  );
  app.use(helmet());

  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  /**
   * Paystack webhook MUST receive the raw body Buffer for HMAC verification.
   * Mount before express.json() so the body is not parsed/re-serialized.
   * No JWT auth — secured via x-paystack-signature.
   */
  app.post(
    "/api/payment/webhook",
    webhookRateLimiter,
    express.raw({ type: "application/json" }),
    paystackWebhook
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(logger);
  app.use(apiRateLimiter);

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
  app.use("/api/admin/pricing", adminPricingRoutes);
  app.use("/api/pricing", publicPricingRoutes);

  swaggerDocs(app, port);

  app.use(errorHandler);

  return app;
};

export default createApp;
