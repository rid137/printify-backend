import express from "express";
import {
  readTransaction,
  getUserTransaction,
} from "../../controllers/transaction.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {
  validateParams,
  validateQuery,
} from "../../middlewares/validate.middleware.js";
import { objectIdParamSchema } from "../../validations/common.schema.js";
import { userTransactionsQuerySchema } from "../../validations/transaction.schema.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/own",
  validateQuery(userTransactionsQuerySchema),
  getUserTransaction
);
router.get("/:id", validateParams(objectIdParamSchema), readTransaction);

export default router;
