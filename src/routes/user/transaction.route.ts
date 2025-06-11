import express from "express";
import {
    readTransaction,
    getUserTransaction,
} from "../../controllers/transaction.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/own", getUserTransaction);
router.get("/:id", readTransaction);

export default router;