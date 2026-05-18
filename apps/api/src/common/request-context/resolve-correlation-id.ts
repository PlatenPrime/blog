import { isValidTraceId, normalizeIncomingHeader } from './incoming-trace-id';

export function resolveCorrelationId(
  incomingHeader: string | string[] | undefined,
  requestId: string,
): string {
  const candidate = normalizeIncomingHeader(incomingHeader);

  if (candidate !== undefined && isValidTraceId(candidate)) {
    return candidate;
  }

  return requestId;
}
