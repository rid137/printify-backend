import express from "express";
import {
  getCurrentUserProfile,
  updateCurrentUserProfile,
} from "../../controllers/user.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validateBody } from "../../middlewares/validate.middleware.js";
import { updateProfileBodySchema } from "../../validations/user.schema.js";

const router = express.Router();

router.use(authenticate);

router
  .route("/profile")
  .get(getCurrentUserProfile)
  .put(validateBody(updateProfileBodySchema), updateCurrentUserProfile);

export default router;
