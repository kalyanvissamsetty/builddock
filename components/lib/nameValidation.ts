const PATH_SAFE_SEGMENT_REGEX = /^[a-z0-9._-]+$/;
export const MAX_NAME_LENGTH = 30;

export function isPathSafeSegment(value: unknown) {
  return typeof value === "string" && value === value.trim() && PATH_SAFE_SEGMENT_REGEX.test(value);
}

export function pathSafeSegmentMessage(label: string) {
  return `${label} can only contain lowercase letters, numbers, "-", "_", and "." with no spaces`;
}

export function isNameWithinLimit(value: unknown) {
  return typeof value === "string" && value.trim().length <= MAX_NAME_LENGTH;
}

export function nameLengthMessage(label: string) {
  return `${label} must be ${MAX_NAME_LENGTH} characters or less`;
}
