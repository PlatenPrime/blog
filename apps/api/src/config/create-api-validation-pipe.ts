import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { mapClassValidatorErrors } from '../errors/map-class-validator-errors';

const VALIDATION_FAILED_MESSAGE = 'Validation failed';

export function createApiValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) =>
      new BadRequestException({
        message: VALIDATION_FAILED_MESSAGE,
        details: mapClassValidatorErrors(errors),
      }),
  });
}
