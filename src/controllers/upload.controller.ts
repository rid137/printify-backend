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

  // Filter out non-PDF files
  const pdfFiles = filesArray.filter((file: any) => {
    const filename = file.name || file.originalFilename || "";
    return filename.toLowerCase().endsWith(".pdf");
  });

  if (pdfFiles.length === 0) {
    throw BadRequest("Only PDF files are allowed");
  }

  const uploadedFiles: UploadedFile[] = [];
  
  // Process each file sequentially
  for (const file of filesArray) {
    try {
      const tempFilePath = file.path;
      const originalFilename = file.name;

      // Validate the temporary file exists before processing
      if (!tempFilePath || !fs.existsSync(tempFilePath)) {
        console.error(`File missing or invalid: ${originalFilename || 'unknown'}`);
        continue;
      }

      // Create readable stream for efficient memory usage with large files
      const stream = fs.createReadStream(tempFilePath);

      // Generate unique public ID for Cloudinary (using original filename or timestamp)
      const publicId = originalFilename 
        ? originalFilename.split('.')[0]  // Remove extension
        : `file_${Date.now()}`;  // Fallback to timestamp

      // Upload to Cloudinary using stream for better performance
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

        // Pipe the file stream to Cloudinary
        stream.pipe(uploadStream);
      });

      // Store successful upload metadata
      uploadedFiles.push({
        url: result.secure_url,    
        public_id: result.public_id, 
        pages: result.pages,
        originalFilename            
      });

      // Clean up temporary file
      fs.unlinkSync(tempFilePath);
    } catch (error) {
      console.error(`Error uploading file:`, error);
      // Ensure temporary file is cleaned up even if upload fails
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }
  }

  if (uploadedFiles.length === 0) {
    throw new Error("All file uploads failed");
  }

  // Prepare response object
  const response: UploadResponse = {
    success: true,
    uploadedFiles,
    count: uploadedFiles.length,
    message: uploadedFiles.length === filesArray.length 
      ? "All files uploaded successfully" 
      : `Uploaded ${uploadedFiles.length} of ${filesArray.length} files`
  };

  // Return standardized success response
  successResponse(res, response, response.message);
});