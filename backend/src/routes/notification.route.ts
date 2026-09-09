import { Router } from "express";
import {
  registerDevice,
  sendTestNotification,
} from "../controllers/notification.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { registerDeviceBodySchema } from "../validations/notification.schema.js";

const router = Router();

router.use(authenticate);

router.post(
  "/register-device",
  validateBody(registerDeviceBodySchema),
  registerDevice
);
router.post("/send-test", sendTestNotification);

export default router;
