import express from "express";
import {
  removeTransaction,
  listTransaction,
} from "../../controllers/transaction.controller.js";
import {
  authenticate,
  authorizeAdmin,
} from "../../middlewares/auth.middleware.js";
import {
  validateParams,
  validateQuery,
} from "../../middlewares/validate.middleware.js";
import { objectIdParamSchema } from "../../validations/common.schema.js";
import { transactionFilterQuerySchema } from "../../validations/transaction.schema.js";

const router = express.Router();
router.use(authenticate, authorizeAdmin);

router.get("/", validateQuery(transactionFilterQuerySchema), listTransaction);
router.delete(
  "/:id",
  validateParams(objectIdParamSchema),
  removeTransaction
);

export default router;
