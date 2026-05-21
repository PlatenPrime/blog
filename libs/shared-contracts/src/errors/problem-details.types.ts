import type { ApiErrorCode, ApiErrorDetails } from './api-error.types.js';
import {
  API_ERROR_CODE_BAD_REQUEST,
  API_ERROR_CODE_CONFLICT,
  API_ERROR_CODE_FORBIDDEN,
  API_ERROR_CODE_INTERNAL,
  API_ERROR_CODE_NOT_FOUND,
  API_ERROR_CODE_REQUEST_TIMEOUT,
  API_ERROR_CODE_TOO_MANY_REQUESTS,
  API_ERROR_CODE_UNAUTHORIZED,
  API_ERROR_CODE_VALIDATION,
} from './api-error.types.js';

/** Base URI for `type` identifiers (RFC 9457; obsoletes RFC 7807). */
export const PROBLEM_TYPE_BASE_URI = 'https://blog.dev/problems' as const;

export const PROBLEM_MEDIA_TYPE = 'application/problem+json' as const;

const PROBLEM_TYPE_SLUG_BY_CODE: Readonly<Record<string, string>> = {
  [API_ERROR_CODE_INTERNAL]: 'internal-error',
  [API_ERROR_CODE_VALIDATION]: 'validation-failed',
  [API_ERROR_CODE_NOT_FOUND]: 'not-found',
  [API_ERROR_CODE_UNAUTHORIZED]: 'unauthorized',
  [API_ERROR_CODE_FORBIDDEN]: 'forbidden',
  [API_ERROR_CODE_CONFLICT]: 'conflict',
  [API_ERROR_CODE_BAD_REQUEST]: 'bad-request',
  [API_ERROR_CODE_REQUEST_TIMEOUT]: 'request-timeout',
  [API_ERROR_CODE_TOO_MANY_REQUESTS]: 'too-many-requests',
};

export const PROBLEM_TITLE_BY_CODE: Readonly<Record<string, string>> = {
  [API_ERROR_CODE_INTERNAL]: 'Internal Server Error',
  [API_ERROR_CODE_VALIDATION]: 'Validation Failed',
  [API_ERROR_CODE_NOT_FOUND]: 'Not Found',
  [API_ERROR_CODE_UNAUTHORIZED]: 'Unauthorized',
  [API_ERROR_CODE_FORBIDDEN]: 'Forbidden',
  [API_ERROR_CODE_CONFLICT]: 'Conflict',
  [API_ERROR_CODE_BAD_REQUEST]: 'Bad Request',
  [API_ERROR_CODE_REQUEST_TIMEOUT]: 'Request Timeout',
  [API_ERROR_CODE_TOO_MANY_REQUESTS]: 'Too Many Requests',
};

/**
 * RFC 9457 Problem Details JSON body served as `application/problem+json`.
 * Extension members: `code`, `details`.
 */
export type ProblemDetailsBody = {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail: string;
  readonly instance?: string;
  readonly code: ApiErrorCode;
  readonly details?: ApiErrorDetails;
};

export function problemTypeSlugForCode(code: ApiErrorCode): string {
  const known = PROBLEM_TYPE_SLUG_BY_CODE[code];

  if (known !== undefined) {
    return known;
  }

  return code
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function problemTypeUriForCode(code: ApiErrorCode): string {
  return `${PROBLEM_TYPE_BASE_URI}/${problemTypeSlugForCode(code)}`;
}

export function problemTitleForCode(code: ApiErrorCode): string {
  return PROBLEM_TITLE_BY_CODE[code] ?? 'Error';
}
