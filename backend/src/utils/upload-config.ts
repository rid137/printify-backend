/**
 * Shared upload size config. Per-file limit only (not a multi-file session total).
 */
export const getMaxUploadSizeMb = (): number => {
  const parsed = Number(process.env.MAX_UPLOAD_SIZE_MB);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 10;
  }
  return parsed;
};

export const getMaxUploadBytes = (): number =>
  getMaxUploadSizeMb() * 1024 * 1024;
