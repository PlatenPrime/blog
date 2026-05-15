/** Liveness indicator key (`GET /health`). */
export const HEALTH_INDICATOR_API = 'api' as const;

/** Readiness indicator key (`GET /health/ready`). */
export const HEALTH_INDICATOR_DATABASE = 'database' as const;

export type HealthIndicatorStatus = 'up' | 'down';

export type HealthCheckStatus = 'ok' | 'error';

export type HealthIndicatorDetail = {
  readonly status: HealthIndicatorStatus;
  readonly message?: string;
};

export type HealthIndicatorMap = Readonly<
  Record<string, HealthIndicatorDetail>
>;

/**
 * Nest Terminus health check JSON envelope (`status`, `info`, `error`, `details`).
 */
export type HealthCheckResponseBody = {
  readonly status: HealthCheckStatus;
  readonly info: HealthIndicatorMap;
  readonly error: HealthIndicatorMap;
  readonly details: HealthIndicatorMap;
};

/** Successful `GET /health` response (liveness, indicator `api`). */
export type LivenessHealthResponse = HealthCheckResponseBody & {
  readonly status: 'ok';
  readonly info: { readonly api: HealthIndicatorDetail };
  readonly error: Record<string, never>;
  readonly details: { readonly api: HealthIndicatorDetail };
};

/**
 * `GET /health/ready` response (readiness, indicator `database`).
 * On success: `status: 'ok'`, empty `error`. On dependency failure: HTTP 503,
 * `status: 'error'`, `database` in `error` / `details` with `status: 'down'`.
 */
export type ReadinessHealthResponse = HealthCheckResponseBody & {
  readonly info: { readonly database: HealthIndicatorDetail };
  readonly details: { readonly database: HealthIndicatorDetail };
};
