import express from "express";
import {
    removeTransaction,
    listTransaction,
} from "../../controllers/transaction.controller.js";
import { authenticate, authorizeAdmin } from "../../middlewares/auth.middleware.js";

const router = express.Router();
router.use(authenticate, authorizeAdmin);

router.get("/", listTransaction);
router.delete("/:id", removeTransaction)

export default router;