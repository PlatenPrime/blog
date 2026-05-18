/**
 * Semantic version of the shared-contracts package (bump on breaking changes).
 */
export const SHARED_CONTRACTS_VERSION = '0.0.1' as const;

export {
  API_ERROR_CODE_BAD_REQUEST,
  API_ERROR_CODE_CONFLICT,
  API_ERROR_CODE_FORBIDDEN,
  API_ERROR_CODE_INTERNAL,
  API_ERROR_CODE_NOT_FOUND,
  API_ERROR_CODE_UNAUTHORIZED,
  API_ERROR_CODE_VALIDATION,
} from './errors/api-error.types.js';
export type {
  ApiErrorBody,
  ApiErrorCode,
  ApiErrorDetails,
  ApiValidationFieldError,
  PlatformApiErrorCode,
} from './errors/api-error.types.js';

export {
  PROBLEM_MEDIA_TYPE,
  PROBLEM_TITLE_BY_CODE,
  PROBLEM_TYPE_BASE_URI,
  problemTitleForCode,
  problemTypeSlugForCode,
  problemTypeUriForCode,
} from './errors/problem-details.types.js';
export type { ProblemDetailsBody } from './errors/problem-details.types.js';
export {
  apiValidationFieldErrorSchema,
  problemDetailsBodySchema,
} from './errors/problem-details.schema.js';
export type { ProblemDetailsBodySchema } from './errors/problem-details.schema.js';

export type {
  ExampleItem,
  ListExamplesResponse,
} from './examples/example.types.js';

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
