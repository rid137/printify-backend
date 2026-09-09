import { apiRequest } from "./client";
import type { UploadResult } from "./types";

export const uploadsApi = {
  upload: (files: File[], onProgress?: (percent: number) => void) => {
    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }
    return apiRequest<UploadResult>("/api/upload", {
      method: "POST",
      formData,
      onProgress,
    });
  },
};
