import express from "express";
import formidable from "express-formidable";
import { uploadFiles } from "../controllers/upload.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { getMaxUploadBytes } from "../utils/upload-config.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  formidable({
    keepExtensions: true,
    maxFileSize: getMaxUploadBytes(),
  }),
  uploadFiles
);

export default router;
