/**
 * Cloudinary public_id ownership helpers.
 * Uploads use folder `printing-app` and public_id `{userId}_{uuid}`.
 * Cloudinary stores that as `printing-app/{userId}_{uuid}`.
 */

export const CLOUDINARY_UPLOAD_FOLDER = "printing-app";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Strip leading slashes; keep folder/id form. */
export const normalizeCloudinaryPublicId = (publicId: string): string =>
  publicId.trim().replace(/^\/+/, "");

export const cloudinaryAssetBasename = (publicId: string): string => {
  const normalized = normalizeCloudinaryPublicId(publicId);
  const slash = normalized.lastIndexOf("/");
  return slash === -1 ? normalized : normalized.slice(slash + 1);
};

/**
 * True only when the id is in the app folder (or bare basename) and the
 * basename is `{userId}_{uuid}` for this user. Rejects other users' ids
 * even if they are well-formed Cloudinary ids.
 */
export const isOwnedCloudinaryPublicId = (
  userId: unknown,
  publicId: string
): boolean => {
  if (userId == null || userId === "") {
    return false;
  }

  const normalized = normalizeCloudinaryPublicId(publicId);
  if (!normalized) {
    return false;
  }

  const slash = normalized.lastIndexOf("/");
  const folder = slash === -1 ? "" : normalized.slice(0, slash);
  const basename = slash === -1 ? normalized : normalized.slice(slash + 1);

  if (folder && folder !== CLOUDINARY_UPLOAD_FOLDER) {
    return false;
  }

  const prefix = `${String(userId)}_`;
  if (!basename.startsWith(prefix)) {
    return false;
  }

  const suffix = basename.slice(prefix.length);
  if (!UUID_RE.test(suffix)) {
    return false;
  }

  const ownedRe = new RegExp(`^${escapeRegex(String(userId))}_`);
  return ownedRe.test(basename);
};

/**
 * Destroy only resources this request created and that belong to this user.
 * Never destroy ids that were already returned to the client (they may be
 * retried on order create) or ids owned by another user.
 */
export const canDestroyUploadedResource = (
  userId: unknown,
  publicId: string,
  options: { returnedToClient: boolean }
): boolean => {
  if (options.returnedToClient) {
    return false;
  }
  return isOwnedCloudinaryPublicId(userId, publicId);
};

/**
 * Order create references previously uploaded files. Deleting them on a
 * failed create would break retry and could remove files still needed.
 */
export const CLEANUP_CLOUDINARY_ON_ORDER_CREATE_FAILURE = false;

export const toCanonicalCloudinaryPublicId = (publicId: string): string => {
  const basename = cloudinaryAssetBasename(publicId);
  return `${CLOUDINARY_UPLOAD_FOLDER}/${basename}`;
};
