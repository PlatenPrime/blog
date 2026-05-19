import {
  type ApiErrorCode,
  problemDetailsBodySchema,
  PROBLEM_MEDIA_TYPE,
  problemTitleForCode,
  problemTypeUriForCode,
  type ProblemDetailsBody,
} from '@blog/shared-contracts';
import { expect } from 'vitest';

const LEGACY_ERROR_BODY_KEYS = [
  'statusCode',
  'message',
  'error',
  'stack',
] as const;

export type ExpectProblemDetailsContractOptions = {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly detail?: string | RegExp;
  readonly expectDetails?: boolean;
};

export type ProblemDetailsContractResult = {
  readonly body: ProblemDetailsBody;
};

export function expectProblemDetailsContract(
  response: {
    readonly status: number;
    readonly headers: Record<string, unknown>;
    readonly body: unknown;
  },
  options: ExpectProblemDetailsContractOptions,
): ProblemDetailsContractResult {
  const contentType = response.headers['content-type'];
  expect(typeof contentType).toBe('string');
  expect(contentType).toContain(PROBLEM_MEDIA_TYPE);

  const parsed = problemDetailsBodySchema.safeParse(response.body);
  expect(parsed.success).toBe(true);
  if (!parsed.success) {
    throw new Error('Expected problem details body to match schema');
  }

  const body = parsed.data;

  expect(response.status).toBe(options.status);
  expect(body.status).toBe(options.status);
  expect(body.code).toBe(options.code);
  expect(body.type).toBe(problemTypeUriForCode(options.code));
  expect(body.title).toBe(problemTitleForCode(options.code));

  if (options.detail !== undefined) {
    if (options.detail instanceof RegExp) {
      expect(body.detail).toMatch(options.detail);
    } else {
      expect(body.detail).toBe(options.detail);
    }
  }

  if (options.expectDetails === true) {
    expect(body.details?.length).toBeGreaterThan(0);
  } else if (options.expectDetails === false) {
    expect(body.details).toBeUndefined();
  }

  for (const key of LEGACY_ERROR_BODY_KEYS) {
    expect(response.body).not.toHaveProperty(key);
  }

  return { body };
}
