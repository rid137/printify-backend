import fs from "fs/promises";
import { createReadStream } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { fileTypeFromBuffer } from "file-type";
import { UploadApiResponse } from "cloudinary";
import cloudinary from "../utils/cloudinary.js";
import { getMaxUploadBytes } from "../utils/upload-config.js";
import { MAX_UPLOAD_FILES } from "../utils/limits.js";
import {
  CLOUDINARY_UPLOAD_FOLDER,
  canDestroyUploadedResource,
  isOwnedCloudinaryPublicId,
  toCanonicalCloudinaryPublicId,
} from "../utils/cloudinary-public-id.js";
import { getErrorMessage } from "../utils/error/getErrorMessage.js";
import {
  BadRequest,
  Forbidden,
  InternalServerError,
  NotFound,
} from "../utils/error/httpErrors.js";
import CustomError from "../utils/error/customError.js";

export interface TrustedCloudinaryAsset {
  publicId: string;
  url: string;
  /** Cloudinary `pages` when present and ≥ 1; otherwise null (never invented). */
  pages: number | null;
  bytes?: number;
  format?: string;
  resourceType: "image" | "raw";
}

export type SupportedUploadFormat = "pdf" | "docx" | "pptx";

export interface UploadedFile {
  url: string;
  public_id: string;
  /** Cloudinary `pages` when present; null when Cloudinary does not provide it. */
  pages: number | null;
  originalFilename: string;
  mimeType: string;
  size: number;
  format: SupportedUploadFormat;
}

export interface FailedUpload {
  originalFilename: string;
  reason: string;
}

export interface UploadResult {
  success: boolean;
  uploadedFiles: UploadedFile[];
  failedFiles: FailedUpload[];
  count: number;
  message: string;
}

type FormidableFile = {
  path?: string;
  name?: string;
  originalFilename?: string;
  type?: string;
  size?: number;
};

const ALLOWED_EXTENSIONS: Record<
  string,
  { format: SupportedUploadFormat; mime: string }
> = {
  ".pdf": { format: "pdf", mime: "application/pdf" },
  ".docx": {
    format: "docx",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  ".pptx": {
    format: "pptx",
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  },
};

const safeUnlink = async (filePath?: string) => {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch {
    // Already removed or missing — ignore
  }
};

const basenameOnly = (filename: string): string => {
  // Prevent path traversal / absolute paths from client-supplied names
  return path.basename(filename.replace(/\\/g, "/"));
};

const readFileHead = async (filePath: string, length = 4100): Promise<Buffer> => {
  const handle = await fs.open(filePath, "r");
  try {
    const buffer = Buffer.alloc(length);
    const { bytesRead } = await handle.read(buffer, 0, length, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
};

/**
 * OOXML (docx/pptx) are ZIP packages. Require ZIP magic + Content_Types +
 * format-specific folder markers so a renamed arbitrary ZIP is rejected.
 */
const looksLikeOoxml = (
  head: Buffer,
  fullScanBuffer: Buffer,
  format: "docx" | "pptx"
): boolean => {
  // ZIP local file header
  if (head.length < 4 || head[0] !== 0x50 || head[1] !== 0x4b) {
    return false;
  }

  const asLatin1 = fullScanBuffer.toString("latin1");
  if (!asLatin1.includes("[Content_Types].xml")) {
    return false;
  }

  if (format === "docx") {
    return asLatin1.includes("word/");
  }

  return asLatin1.includes("ppt/");
};

const validateFileContent = async (
  filePath: string,
  format: SupportedUploadFormat
): Promise<void> => {
  const head = await readFileHead(filePath, 4100);
  const detected = await fileTypeFromBuffer(head);

  if (format === "pdf") {
    const isPdfMagic = head.toString("utf8", 0, 5) === "%PDF-";
    const isPdfType =
      detected?.mime === "application/pdf" || detected?.ext === "pdf";

    if (!isPdfMagic || !isPdfType) {
      throw BadRequest("Invalid or corrupted PDF file");
    }
    return;
  }

  // DOCX / PPTX
  if (detected?.mime !== "application/zip" && detected?.ext !== "zip") {
    throw BadRequest(
      format === "docx"
        ? "Invalid or corrupted Word document"
        : "Invalid or corrupted PowerPoint presentation"
    );
  }

  // Scan a larger prefix for OOXML markers (central directory often near end —
  // read whole file for small uploads; size already capped at MAX_UPLOAD_SIZE).
  const full = await fs.readFile(filePath);
  if (!looksLikeOoxml(head, full, format)) {
    throw BadRequest(
      format === "docx"
        ? "File is not a valid .docx document"
        : "File is not a valid .pptx presentation"
    );
  }
};

const resolveAllowedFormat = (
  originalFilename: string
): { format: SupportedUploadFormat; mime: string; extension: string } => {
  const extension = path.extname(originalFilename).toLowerCase();
  const allowed = ALLOWED_EXTENSIONS[extension];

  if (!allowed) {
    throw BadRequest(
      "Unsupported file type. Allowed types: PDF, DOCX, PPTX"
    );
  }

  return { ...allowed, extension };
};

const uploadToCloudinary = (
  filePath: string,
  format: SupportedUploadFormat,
  publicId: string
): Promise<UploadApiResponse> =>
  new Promise((resolve, reject) => {
    /**
     * PDF: image resource type so Cloudinary can return `pages`.
     * DOCX/PPTX: raw — Cloudinary does not page-count Office files without
     * the Aspose add-on (async). We do not enable Aspose here.
     */
    const resourceType = format === "pdf" ? "image" : "raw";

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: CLOUDINARY_UPLOAD_FOLDER,
        resource_type: resourceType,
        public_id: publicId,
        use_filename: false,
        unique_filename: false,
        overwrite: false,
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

    createReadStream(filePath).pipe(uploadStream);
  });

export class UploadService {
  static async uploadFiles(
    filesInput: unknown,
    userId: unknown
  ): Promise<UploadResult> {
    if (!filesInput) {
      throw BadRequest("No files uploaded");
    }

    if (userId == null || userId === "") {
      throw BadRequest("Authenticated user is required for upload");
    }

    const filesArray: FormidableFile[] = Array.isArray(filesInput)
      ? filesInput
      : [filesInput as FormidableFile];

    if (filesArray.length === 0) {
      throw BadRequest("No files uploaded");
    }

    if (filesArray.length > MAX_UPLOAD_FILES) {
      throw BadRequest(
        `At most ${MAX_UPLOAD_FILES} files can be uploaded at once`
      );
    }

    const maxBytes = getMaxUploadBytes();
    const uploadedFiles: UploadedFile[] = [];
    const failedFiles: FailedUpload[] = [];

    for (const file of filesArray) {
      const rawName = file.name || file.originalFilename || "unnamed";
      const originalFilename = basenameOnly(rawName);
      const tempFilePath = file.path;
      let createdPublicId: string | undefined;

      try {
        if (!tempFilePath) {
          throw BadRequest("Temporary upload file is missing");
        }

        await fs.access(tempFilePath);

        let size = typeof file.size === "number" ? file.size : 0;
        if (!size) {
          const stats = await fs.stat(tempFilePath);
          size = stats.size;
        }

        if (size <= 0) {
          throw BadRequest("Uploaded file is empty");
        }

        if (size > maxBytes) {
          throw BadRequest(
            `File too large. Maximum size is ${Math.round(maxBytes / (1024 * 1024))} MB per file`
          );
        }

        const { format, mime } = resolveAllowedFormat(originalFilename);
        await validateFileContent(tempFilePath, format);

        const publicId = `${String(userId)}_${randomUUID()}`;
        let result: UploadApiResponse;

        try {
          result = await uploadToCloudinary(tempFilePath, format, publicId);
        } catch (error) {
          console.error(
            "[upload] Cloudinary upload failed:",
            getErrorMessage(error)
          );
          throw InternalServerError("File upload failed");
        }

        createdPublicId = result.public_id;

        const pages =
          typeof result.pages === "number" && Number.isFinite(result.pages)
            ? result.pages
            : null;

        uploadedFiles.push({
          url: result.secure_url,
          public_id: result.public_id,
          pages,
          originalFilename,
          mimeType: mime,
          size: typeof result.bytes === "number" ? result.bytes : size,
          format,
        });
        createdPublicId = undefined;
      } catch (error) {
        if (typeof createdPublicId === "string" && createdPublicId) {
          await UploadService.destroyOwnedResource(userId, createdPublicId);
        }
        let safeReason = "Upload failed";
        if (error instanceof CustomError) {
          safeReason = error.message;
        }

        console.error(
          `[upload] Failed for ${originalFilename}:`,
          getErrorMessage(error)
        );
        failedFiles.push({ originalFilename, reason: safeReason });
      } finally {
        await safeUnlink(tempFilePath);
      }
    }

    if (uploadedFiles.length === 0) {
      const detail = failedFiles[0]?.reason || "All file uploads failed";
      throw BadRequest(detail);
    }

    return {
      success: failedFiles.length === 0,
      uploadedFiles,
      failedFiles,
      count: uploadedFiles.length,
      message:
        failedFiles.length === 0
          ? "All files uploaded successfully"
          : `Uploaded ${uploadedFiles.length} of ${filesArray.length} files`,
    };
  }

  /**
   * Delete a Cloudinary resource created in the current upload request.
   * No-ops for another user's publicId (ownership check).
   */
  static async destroyOwnedResource(
    userId: unknown,
    publicId: string
  ): Promise<void> {
    if (
      !canDestroyUploadedResource(userId, publicId, { returnedToClient: false })
    ) {
      return;
    }

    const canonicalId = toCanonicalCloudinaryPublicId(publicId);

    for (const resourceType of ["image", "raw"] as const) {
      try {
        await cloudinary.uploader.destroy(canonicalId, {
          resource_type: resourceType,
          invalidate: true,
        });
      } catch (error) {
        console.error(
          "[upload] Cloudinary destroy failed:",
          getErrorMessage(error)
        );
      }
    }
  }

  /**
   * Confirm the Cloudinary resource exists and belongs to `userId`.
   * Page count is taken from Cloudinary only — never from the client.
   */
  static async getTrustedResource(
    userId: unknown,
    publicId: string
  ): Promise<TrustedCloudinaryAsset> {
    if (!isOwnedCloudinaryPublicId(userId, publicId)) {
      throw Forbidden("You do not have access to this file");
    }

    const canonicalId = toCanonicalCloudinaryPublicId(publicId);
    const fetched = await fetchCloudinaryResource(canonicalId);

    if (!fetched) {
      throw NotFound("Uploaded file was not found");
    }

    if (!isOwnedCloudinaryPublicId(userId, fetched.resource.public_id)) {
      throw Forbidden("You do not have access to this file");
    }

    const rawPages = fetched.resource.pages;
    const pages =
      typeof rawPages === "number" &&
      Number.isFinite(rawPages) &&
      rawPages >= 1
        ? rawPages
        : null;

    const url =
      fetched.resource.secure_url || fetched.resource.url || "";
    if (!url) {
      throw InternalServerError("Uploaded file is missing a URL");
    }

    return {
      publicId: fetched.resource.public_id,
      url,
      pages,
      bytes: fetched.resource.bytes,
      format: fetched.resource.format,
      resourceType: fetched.resourceType,
    };
  }
}

type CloudinaryResourceLike = {
  public_id: string;
  secure_url?: string;
  url?: string;
  pages?: number;
  bytes?: number;
  format?: string;
};

const cloudinaryHttpCode = (error: unknown): number | undefined => {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const direct = error as { http_code?: unknown };
  if (typeof direct.http_code === "number") {
    return direct.http_code;
  }

  const nested = error as { error?: { http_code?: unknown } };
  if (typeof nested.error?.http_code === "number") {
    return nested.error.http_code;
  }

  return undefined;
};

const fetchCloudinaryResource = async (
  publicId: string
): Promise<{
  resource: CloudinaryResourceLike;
  resourceType: "image" | "raw";
} | null> => {
  const types: Array<"image" | "raw"> = ["image", "raw"];

  for (const resourceType of types) {
    try {
      const resource = (await cloudinary.api.resource(publicId, {
        resource_type: resourceType,
      })) as CloudinaryResourceLike;
      return { resource, resourceType };
    } catch (error) {
      if (cloudinaryHttpCode(error) === 404) {
        continue;
      }

      console.error(
        "[upload] Cloudinary resource lookup failed:",
        getErrorMessage(error)
      );
      throw InternalServerError("Unable to verify uploaded file");
    }
  }

  return null;
};
