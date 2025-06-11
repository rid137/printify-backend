import express from "express";
import formidable from "express-formidable";
import { uploadFiles } from "../controllers/upload.controller.js";

const router = express.Router();

router.post("/", formidable({ 
  // multiples: true,
  keepExtensions: true,
  maxFileSize: 10 * 1024 * 1024 // 10MB limit
}), uploadFiles);

export default router;