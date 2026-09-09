import express from "express";
import {
  deleteUserById,
  getAllAdminUsers,
  getAllUsers,
  getUserById,
  updateUserById,
} from "../../controllers/user.controller.js";
import {
  authenticate,
  authorizeAdmin,
} from "../../middlewares/auth.middleware.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middlewares/validate.middleware.js";
import {
  listPaginationQuerySchema,
  objectIdParamSchema,
} from "../../validations/common.schema.js";
import { updateUserByIdBodySchema } from "../../validations/user.schema.js";

const router = express.Router();

router.use(authenticate, authorizeAdmin);

router.get(
  "/all-users",
  validateQuery(listPaginationQuerySchema),
  getAllUsers
);
router.get("/admin-users", getAllAdminUsers);
router
  .route("/current-user/:id")
  .delete(validateParams(objectIdParamSchema), deleteUserById)
  .get(validateParams(objectIdParamSchema), getUserById)
  .put(
    validateParams(objectIdParamSchema),
    validateBody(updateUserByIdBodySchema),
    updateUserById
  );

export default router;
