import { QueryFailedError } from 'typeorm';

type PostgresDriverError = {
  readonly code?: string;
  readonly constraint?: string;
};

export function isPostgresUniqueViolation(
  error: unknown,
  constraintName?: string,
): boolean {
  if (!(error instanceof QueryFailedError)) {
    return false;
  }

  const driver = error.driverError as PostgresDriverError | undefined;

  if (driver?.code !== '23505') {
    return false;
  }

  if (constraintName === undefined) {
    return true;
  }

  return driver.constraint === constraintName;
}
