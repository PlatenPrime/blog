import { describe, expect, it } from 'vitest';
import { QueryFailedError } from 'typeorm';
import { isPostgresUniqueViolation } from './is-postgres-unique-violation';

function queryFailedError(props: {
  code?: string;
  constraint?: string;
}): QueryFailedError {
  const driverError = Object.assign(new Error('unique violation'), props);
  return new QueryFailedError('INSERT', [], driverError);
}

describe('isPostgresUniqueViolation', () => {
  it('returns true for QueryFailedError with code 23505', () => {
    const error = queryFailedError({
      code: '23505',
      constraint: 'UQ_users_email',
    });

    expect(isPostgresUniqueViolation(error)).toBe(true);
  });

  it('returns false for other postgres codes', () => {
    const error = queryFailedError({ code: '23503' });

    expect(isPostgresUniqueViolation(error)).toBe(false);
  });

  it('returns false for non-QueryFailedError', () => {
    expect(isPostgresUniqueViolation(new Error('other'))).toBe(false);
  });

  it('matches constraint name when provided', () => {
    const error = queryFailedError({
      code: '23505',
      constraint: 'UQ_users_email',
    });

    expect(isPostgresUniqueViolation(error, 'UQ_users_email')).toBe(true);
    expect(isPostgresUniqueViolation(error, 'UQ_other')).toBe(false);
  });
});
