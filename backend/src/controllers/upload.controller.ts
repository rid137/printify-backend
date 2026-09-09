import asyncHandler from "../middlewares/async-handler.middleware.js";
import { successResponse } from "../utils/apiResponse.js";
import { UploadService } from "../services/upload.service.js";

export const uploadFiles = asyncHandler(async (req, res) => {
  const files = (req as { files?: { files?: unknown } }).files?.files;
  const result = await UploadService.uploadFiles(files, req.user._id);
  successResponse(res, result, result.message);
});
