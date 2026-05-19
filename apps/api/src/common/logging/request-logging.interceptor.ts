import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { isOpsRoutePath } from '../../config/ops-routes';
import { HttpRequestMetricsService } from '../../metrics/http-request-metrics.service';
import {
  REQUEST_COMPLETED_MESSAGE,
  buildRequestLogPayload,
  elapsedMilliseconds,
  resolveRequestLogLevel,
} from './build-request-log-payload';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: PinoLogger,
    private readonly httpMetrics: HttpRequestMetricsService,
  ) {
    this.logger.setContext(RequestLoggingInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    if (isOpsRoutePath(request.path)) {
      return next.handle();
    }

    const startedAt = process.hrtime.bigint();

    return next.handle().pipe(
      tap(() => {
        this.recordRequestOutcome({
          method: request.method,
          path: request.path,
          statusCode: response.statusCode,
          startedAt,
        });
      }),
      catchError((error: unknown) => {
        const statusCode =
          error instanceof HttpException ? error.getStatus() : 500;

        this.recordRequestOutcome({
          method: request.method,
          path: request.path,
          statusCode,
          startedAt,
        });

        return throwError(() => error);
      }),
    );
  }

  private recordRequestOutcome(params: {
    readonly method: string;
    readonly path: string;
    readonly statusCode: number;
    readonly startedAt: bigint;
  }): void {
    const responseTimeMs = elapsedMilliseconds(params.startedAt);

    this.httpMetrics.observe({
      method: params.method,
      route: params.path,
      statusCode: params.statusCode,
      durationSeconds: responseTimeMs / 1000,
    });

    const payload = buildRequestLogPayload({
      method: params.method,
      path: params.path,
      statusCode: params.statusCode,
      responseTimeMs,
    });
    const level = resolveRequestLogLevel(params.statusCode);

    this.logger[level](payload, REQUEST_COMPLETED_MESSAGE);
  }
}
