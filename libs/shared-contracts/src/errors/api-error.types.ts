/** Platform-wide error code for unexpected server failures. */
export const API_ERROR_CODE_INTERNAL = 'INTERNAL_ERROR' as const;

/** Safe client-facing message for 5xx / unknown errors (no internal detail leak). */
export const API_INTERNAL_ERROR_MESSAGE = 'Internal server error' as const;

/** Request body or query failed validation. */
export const API_ERROR_CODE_VALIDATION = 'VALIDATION_FAILED' as const;

/** Resource not found. */
export const API_ERROR_CODE_NOT_FOUND = 'NOT_FOUND' as const;

/** Missing or invalid authentication credentials. */
export const API_ERROR_CODE_UNAUTHORIZED = 'UNAUTHORIZED' as const;

/** Authenticated but not permitted for this action. */
export const API_ERROR_CODE_FORBIDDEN = 'FORBIDDEN' as const;

/** State conflict (duplicate, version mismatch, etc.). */
export const API_ERROR_CODE_CONFLICT = 'CONFLICT' as const;

/** Malformed or semantically invalid client request. */
export const API_ERROR_CODE_BAD_REQUEST = 'BAD_REQUEST' as const;

export type PlatformApiErrorCode =
  | typeof API_ERROR_CODE_INTERNAL
  | typeof API_ERROR_CODE_VALIDATION
  | typeof API_ERROR_CODE_NOT_FOUND
  | typeof API_ERROR_CODE_UNAUTHORIZED
  | typeof API_ERROR_CODE_FORBIDDEN
  | typeof API_ERROR_CODE_CONFLICT
  | typeof API_ERROR_CODE_BAD_REQUEST;

/** Machine-readable error code (platform constants or domain-specific strings). */
export type ApiErrorCode = PlatformApiErrorCode | (string & {});

export type ApiValidationFieldError = {
  readonly field: string;
  readonly message: string;
  readonly code?: string;
};

/** Field-level validation errors (ValidationPipe, DTO constraints). */
export type ApiErrorDetails = readonly ApiValidationFieldError[];

/**
 * Internal mapper shape between Nest exceptions and RFC 7807 `ProblemDetailsBody` (step 041).
 * Wire format is `application/problem+json` — use `ProblemDetailsBody` for clients and contract tests.
 */
export type ApiErrorBody = {
  readonly code: ApiErrorCode;
  readonly message: string;
  readonly requestId?: string;
  readonly details?: ApiErrorDetails;
};
