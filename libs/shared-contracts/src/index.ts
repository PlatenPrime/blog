/**
 * Semantic version of the shared-contracts package (bump on breaking changes).
 */
export const SHARED_CONTRACTS_VERSION = '0.0.1' as const;

/**
 * Placeholder for cross-stack API error payloads (expanded in Platform Core track).
 */
export type ApiErrorBodyStub = {
  readonly code: string;
  readonly message: string;
};

export {
  HEALTH_INDICATOR_API,
  HEALTH_INDICATOR_DATABASE,
} from './health/health-response.types.js';
export type {
  HealthCheckResponseBody,
  HealthCheckStatus,
  HealthIndicatorDetail,
  HealthIndicatorMap,
  HealthIndicatorStatus,
  LivenessHealthResponse,
  ReadinessHealthResponse,
} from './health/health-response.types.js';
