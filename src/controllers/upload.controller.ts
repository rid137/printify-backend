import cloudinary from "../utils/cloudinary.js";
import fs from "fs";
import asyncHandler from "../middlewares/async-handler.middleware.js";
import { UploadApiResponse } from "cloudinary";
import { successResponse } from "../utils/apiResponse.js";
import { BadRequest } from "../utils/error/httpErrors.js";

interface UploadedFile {
  url: string;
  public_id: string;
  pages: number;
  originalFilename?: string;
}

interface UploadResponse {
  success: boolean;
  uploadedFiles: UploadedFile[];
  count: number;
  message: string;
}

export const uploadFiles = asyncHandler(async (req, res) => {
  const files = (req as any).files?.files;

  if (!files) {
    throw BadRequest("No files uploaded");
  }

  const filesArray = Array.isArray(files) ? files : [files];

  const pdfFiles = filesArray.filter((file: any) => {
    const filename = file.name || file.originalFilename || "";
    return filename.toLowerCase().endsWith(".pdf");
  });

  if (pdfFiles.length === 0) {
    throw BadRequest("Only PDF files are allowed");
  }

  const uploadedFiles: UploadedFile[] = [];
  
  for (const file of filesArray) {
    try {
      const tempFilePath = file.path;
      const originalFilename = file.name;

      if (!tempFilePath || !fs.existsSync(tempFilePath)) {
        console.error(`File missing or invalid: ${originalFilename || 'unknown'}`);
        continue;
      }

      const stream = fs.createReadStream(tempFilePath);

      const publicId = originalFilename 
        ? originalFilename.split('.')[0]
        : `file_${Date.now()}`;

      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "printing-app",
            resource_type: "auto",    
            public_id: publicId        
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else if (result) {
              resolve(result);
            } else {
              reject(new Error("Upload failed with no error or result"));
            }
          }
        );

        stream.pipe(uploadStream);
      });

      uploadedFiles.push({
        url: result.secure_url,    
        public_id: result.public_id, 
        pages: result.pages,
        originalFilename            
      });

      fs.unlinkSync(tempFilePath);
    } catch (error) {
      console.error(`Error uploading file:`, error);
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }
  }

  if (uploadedFiles.length === 0) {
    throw new Error("All file uploads failed");
  }

  const response: UploadResponse = {
    success: true,
    uploadedFiles,
    count: uploadedFiles.length,
    message: uploadedFiles.length === filesArray.length 
      ? "All files uploaded successfully" 
      : `Uploaded ${uploadedFiles.length} of ${filesArray.length} files`
  };

  successResponse(res, response, response.message);
});