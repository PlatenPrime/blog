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
import {
  REQUEST_COMPLETED_MESSAGE,
  buildRequestLogPayload,
  elapsedMilliseconds,
  resolveRequestLogLevel,
} from './build-request-log-payload';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(RequestLoggingInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const startedAt = process.hrtime.bigint();

    return next.handle().pipe(
      tap(() => {
        this.logRequest({
          method: request.method,
          path: request.path,
          statusCode: response.statusCode,
          startedAt,
        });
      }),
      catchError((error: unknown) => {
        const statusCode =
          error instanceof HttpException ? error.getStatus() : 500;

        this.logRequest({
          method: request.method,
          path: request.path,
          statusCode,
          startedAt,
        });

        return throwError(() => error);
      }),
    );
  }

  private logRequest(params: {
    readonly method: string;
    readonly path: string;
    readonly statusCode: number;
    readonly startedAt: bigint;
  }): void {
    const payload = buildRequestLogPayload({
      method: params.method,
      path: params.path,
      statusCode: params.statusCode,
      responseTimeMs: elapsedMilliseconds(params.startedAt),
    });
    const level = resolveRequestLogLevel(params.statusCode);

    this.logger[level](payload, REQUEST_COMPLETED_MESSAGE);
  }
}
