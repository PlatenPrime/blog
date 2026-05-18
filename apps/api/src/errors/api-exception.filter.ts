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
import {
  PROBLEM_MEDIA_TYPE,
  type ProblemDetailsBody,
} from '@blog/shared-contracts';
import { RequestContextStore } from '../common/request-context';
import { mapApiErrorToProblemDetails } from './map-api-error-to-problem-details';
import { mapExceptionToApiError } from './map-exception-to-api-error';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly requestContextStore: RequestContextStore,
  ) {}

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

    const { status, body } = mapExceptionToApiError(exception, {
      requestId: this.requestContextStore.getRequestId(),
    });
    const problemBody = mapApiErrorToProblemDetails(status, body);
    const { httpAdapter } = this.httpAdapterHost;
    const response = host.switchToHttp().getResponse<Response>();

    httpAdapter.setHeader(response, 'Content-Type', PROBLEM_MEDIA_TYPE);
    httpAdapter.reply(
      response,
      problemBody satisfies ProblemDetailsBody,
      status,
    );
  }
}
