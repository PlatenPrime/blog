import type { ApiErrorDetails } from '@blog/shared-contracts';
import type { ValidationError } from 'class-validator';

export function mapClassValidatorErrors(
  errors: readonly ValidationError[],
  parentPath = '',
): ApiErrorDetails {
  const details: ApiErrorDetails[number][] = [];

  for (const error of errors) {
    const fieldPath = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;

    if (error.constraints) {
      for (const [code, message] of Object.entries(error.constraints)) {
        details.push({
          field: fieldPath,
          message,
          code,
        });
      }
    }

    if (error.children?.length) {
      details.push(...mapClassValidatorErrors(error.children, fieldPath));
    }
  }

  return details;
}
