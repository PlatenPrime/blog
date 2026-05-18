import {
  REQUEST_ID_MAX_LENGTH,
  REQUEST_ID_PATTERN,
} from './request-id.constants';

export function normalizeIncomingHeader(
  incomingHeader: string | string[] | undefined,
): string | undefined {
  if (incomingHeader === undefined) {
    return undefined;
  }

  const value = Array.isArray(incomingHeader)
    ? incomingHeader[0]
    : incomingHeader;

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

export function isValidTraceId(value: string): boolean {
  return (
    value.length <= REQUEST_ID_MAX_LENGTH && REQUEST_ID_PATTERN.test(value)
  );
}
