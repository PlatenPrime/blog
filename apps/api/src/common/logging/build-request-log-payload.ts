export const REQUEST_COMPLETED_MESSAGE = 'request completed';

export type RequestLogLevel = 'info' | 'warn' | 'error';

export type RequestLogPayload = {
  readonly access: {
    readonly method: string;
    readonly url: string;
    readonly statusCode: number;
    readonly responseTime: number;
  };
};

export function resolveRequestLogLevel(statusCode: number): RequestLogLevel {
  if (statusCode >= 500) {
    return 'error';
  }

  if (statusCode >= 400) {
    return 'warn';
  }

  return 'info';
}

export function buildRequestLogPayload(params: {
  readonly method: string;
  readonly path: string;
  readonly statusCode: number;
  readonly responseTimeMs: number;
}): RequestLogPayload {
  return {
    access: {
      method: params.method,
      url: params.path,
      statusCode: params.statusCode,
      responseTime: params.responseTimeMs,
    },
  };
}

export function elapsedMilliseconds(startedAt: bigint): number {
  const elapsedNs = process.hrtime.bigint() - startedAt;
  return Number(elapsedNs / 1_000_000n);
}
