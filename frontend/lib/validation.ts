export function rangeError(
  value: number,
  min: number,
  max: number,
  label: string
): string | undefined {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < min || value > max) {
    return `${label} must be between ${min.toLocaleString()} and ${max.toLocaleString()}.`;
  }
  return undefined;
}
