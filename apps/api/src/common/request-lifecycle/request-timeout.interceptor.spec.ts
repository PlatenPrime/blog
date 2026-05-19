import {
  CallHandler,
  ExecutionContext,
  RequestTimeoutException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { firstValueFrom, of, throwError, timer, map } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { ApiShutdownCoordinator } from '../shutdown/api-shutdown-coordinator.service';
import type { InFlightRequestsService } from '../shutdown/in-flight-requests.service';
import { SERVER_SHUTTING_DOWN_MESSAGE } from './request-timeout.interceptor';
import { RequestTimeoutInterceptor } from './request-timeout.interceptor';

function createHttpContext(): ExecutionContext {
  const request = {
    method: 'GET',
    path: '/test',
    on: vi.fn(),
    off: vi.fn(),
  } as unknown as Request;

  const response = {
    writableEnded: false,
  } as Response;

  return {
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as ExecutionContext;
}

function createCallHandler(result: unknown): CallHandler {
  return {
    handle: () =>
      result instanceof Error ? throwError(() => result) : of(result),
  };
}

function createInterceptor(deps: {
  readonly requestTimeoutMs?: number;
  readonly isShuttingDown?: boolean;
  readonly inFlight?: Pick<InFlightRequestsService, 'increment' | 'decrement'>;
}) {
  const increment = vi.fn();
  const decrement = vi.fn();

  const inFlight = {
    increment: deps.inFlight?.increment ?? increment,
    decrement: deps.inFlight?.decrement ?? decrement,
  };

  const shutdown = {
    isServerShuttingDown: () => deps.isShuttingDown ?? false,
  } as ApiShutdownCoordinator;

  const interceptor = new RequestTimeoutInterceptor(
    deps.requestTimeoutMs ?? 50,
    inFlight as InFlightRequestsService,
    shutdown,
  );

  return { interceptor, increment, decrement };
}

describe('RequestTimeoutInterceptor', () => {
  it('skips non-http contexts without touching in-flight count', async () => {
    const { interceptor, increment, decrement } = createInterceptor({});
    const context = { getType: () => 'rpc' } as ExecutionContext;

    await firstValueFrom(
      interceptor.intercept(context, createCallHandler('ok')),
    );

    expect(increment).not.toHaveBeenCalled();
    expect(decrement).not.toHaveBeenCalled();
  });

  it('completes fast handlers and decrements in-flight', async () => {
    const { interceptor, increment, decrement } = createInterceptor({});

    await firstValueFrom(
      interceptor.intercept(createHttpContext(), createCallHandler('ok')),
    );

    expect(increment).toHaveBeenCalledTimes(1);
    expect(decrement).toHaveBeenCalledTimes(1);
  });

  it('maps RxJS timeout to RequestTimeoutException', async () => {
    const { interceptor } = createInterceptor({ requestTimeoutMs: 10 });

    await expect(
      firstValueFrom(
        interceptor.intercept(createHttpContext(), {
          handle: () => timer(100).pipe(map(() => 'late')),
        }),
      ),
    ).rejects.toBeInstanceOf(RequestTimeoutException);
  });

  it('rejects new requests with 503 while shutting down', () => {
    const { interceptor } = createInterceptor({ isShuttingDown: true });

    expect(() =>
      interceptor.intercept(createHttpContext(), createCallHandler('ok')),
    ).toThrow(ServiceUnavailableException);

    try {
      interceptor.intercept(createHttpContext(), createCallHandler('ok'));
    } catch (error) {
      expect(
        (error as ServiceUnavailableException).getResponse(),
      ).toMatchObject({
        message: SERVER_SHUTTING_DOWN_MESSAGE,
        statusCode: 503,
      });
    }
  });

  it('does not increment in-flight when shutting down', () => {
    const increment = vi.fn();
    const { interceptor } = createInterceptor({
      isShuttingDown: true,
      inFlight: { increment, decrement: vi.fn() },
    });

    expect(() =>
      interceptor.intercept(createHttpContext(), createCallHandler('ok')),
    ).toThrow(ServiceUnavailableException);
    expect(increment).not.toHaveBeenCalled();
  });
});
