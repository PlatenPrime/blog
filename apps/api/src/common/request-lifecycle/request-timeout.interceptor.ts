import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
  RequestTimeoutException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, TimeoutError, defer, throwError } from 'rxjs';
import { catchError, finalize, takeUntil, tap, timeout } from 'rxjs/operators';
import { recordRequestLifecycleSpanEvent } from '../tracing/record-request-lifecycle-span';
import { ApiShutdownCoordinator } from '../shutdown/api-shutdown-coordinator.service';
import { InFlightRequestsService } from '../shutdown/in-flight-requests.service';
import { clientAbort$ } from './client-abort';
import { REQUEST_TIMEOUT_MS } from './request-timeout.tokens';

export const SERVER_SHUTTING_DOWN_MESSAGE = 'Server is shutting down';

@Injectable()
export class RequestTimeoutInterceptor implements NestInterceptor {
  constructor(
    @Inject(REQUEST_TIMEOUT_MS)
    private readonly requestTimeoutMs: number,
    private readonly inFlight: InFlightRequestsService,
    private readonly shutdown: ApiShutdownCoordinator,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    if (this.shutdown.isServerShuttingDown()) {
      throw new ServiceUnavailableException(SERVER_SHUTTING_DOWN_MESSAGE);
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const abort$ = clientAbort$(request, response).pipe(
      tap(() => {
        recordRequestLifecycleSpanEvent('client_abort');
      }),
    );

    return defer(() => {
      this.inFlight.increment();
      return next.handle();
    }).pipe(
      timeout({ first: this.requestTimeoutMs }),
      takeUntil(abort$),
      catchError((error: unknown) => {
        if (error instanceof TimeoutError) {
          recordRequestLifecycleSpanEvent('timeout');
          return throwError(() => new RequestTimeoutException());
        }

        return throwError(() => error);
      }),
      finalize(() => {
        this.inFlight.decrement();
      }),
    );
  }
}
