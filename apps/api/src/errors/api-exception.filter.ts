import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { HealthCheckError } from '@nestjs/terminus';
import type { Response } from 'express';
import type { ApiErrorBody } from '@blog/shared-contracts';
import { mapExceptionToApiError } from './map-exception-to-api-error';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    if (exception instanceof HealthCheckError) {
      throw exception;
    }

    if (!(exception instanceof HttpException)) {
      this.logger.error(
        exception instanceof Error ? exception.message : 'Unknown error',
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const { status, body } = mapExceptionToApiError(exception);
    const { httpAdapter } = this.httpAdapterHost;
    const response = host.switchToHttp().getResponse<Response>();

    httpAdapter.reply(response, body satisfies ApiErrorBody, status);
  }
}
