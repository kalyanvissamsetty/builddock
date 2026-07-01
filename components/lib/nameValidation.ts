const PATH_SAFE_SEGMENT_REGEX = /^[a-z0-9._-]+$/;

export function isPathSafeSegment(value: unknown) {
  return typeof value === "string" && value === value.trim() && PATH_SAFE_SEGMENT_REGEX.test(value);
}

export function pathSafeSegmentMessage(label: string) {
  return `${label} can only contain lowercase letters, numbers, "-", "_", and "." with no spaces`;
}
