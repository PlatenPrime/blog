import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { PinoLogger } from 'nestjs-pino';
import { firstValueFrom, of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { RequestLogPayload } from './build-request-log-payload';
import { REQUEST_COMPLETED_MESSAGE } from './build-request-log-payload';
import type { HttpRequestMetricsService } from '../../metrics/http-request-metrics.service';
import { RequestLoggingInterceptor } from './request-logging.interceptor';

function createHttpContext(params: {
  readonly method?: string;
  readonly path?: string;
  readonly statusCode?: number;
}): ExecutionContext {
  const request = {
    method: params.method ?? 'GET',
    path: params.path ?? '/',
  } as Request;
  const response = {
    statusCode: params.statusCode ?? 200,
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

function createHttpMetrics(): {
  httpMetrics: HttpRequestMetricsService;
  observe: ReturnType<typeof vi.fn>;
} {
  const observe = vi.fn();
  return {
    observe,
    httpMetrics: { observe } as unknown as HttpRequestMetricsService,
  };
}

function createLogger(): {
  logger: PinoLogger;
  info: ReturnType<typeof vi.fn>;
  warn: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
} {
  const info = vi.fn();
  const warn = vi.fn();
  const error = vi.fn();

  return {
    info,
    warn,
    error,
    logger: {
      setContext: vi.fn(),
      info,
      warn,
      error,
    } as unknown as PinoLogger,
  };
}

describe('RequestLoggingInterceptor', () => {
  it('skips logging for non-http contexts', async () => {
    const { logger, info, warn, error } = createLogger();
    const interceptor = new RequestLoggingInterceptor(
      logger,
      createHttpMetrics().httpMetrics,
    );
    const context = {
      getType: () => 'rpc',
    } as ExecutionContext;

    await firstValueFrom(
      interceptor.intercept(context, createCallHandler('ok')),
    );

    expect(info).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it('logs successful requests at info with access fields', async () => {
    const { logger, info } = createLogger();
    const { httpMetrics, observe } = createHttpMetrics();
    const interceptor = new RequestLoggingInterceptor(logger, httpMetrics);

    await firstValueFrom(
      interceptor.intercept(
        createHttpContext({ method: 'GET', path: '/', statusCode: 200 }),
        createCallHandler({ ok: true }),
      ),
    );

    expect(info).toHaveBeenCalledOnce();
    expect(info).toHaveBeenCalledWith(
      {
        access: {
          method: 'GET',
          url: '/',
          statusCode: 200,
          responseTime: expect.any(Number) as number,
        },
      },
      REQUEST_COMPLETED_MESSAGE,
    );
    expect(observe).toHaveBeenCalledOnce();
  });

  it('skips access-log and metrics for ops routes', async () => {
    const { logger, info } = createLogger();
    const { httpMetrics, observe } = createHttpMetrics();
    const interceptor = new RequestLoggingInterceptor(logger, httpMetrics);

    await firstValueFrom(
      interceptor.intercept(
        createHttpContext({ method: 'GET', path: '/metrics', statusCode: 200 }),
        createCallHandler('ok'),
      ),
    );

    expect(info).not.toHaveBeenCalled();
    expect(observe).not.toHaveBeenCalled();
  });

  it('logs HttpException at warn with exception status', async () => {
    const { logger, warn } = createLogger();
    const interceptor = new RequestLoggingInterceptor(
      logger,
      createHttpMetrics().httpMetrics,
    );

    await expect(
      firstValueFrom(
        interceptor.intercept(
          createHttpContext({ method: 'POST', path: '/examples' }),
          createCallHandler(new BadRequestException('invalid')),
        ),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(warn).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledWith(
      {
        access: {
          method: 'POST',
          url: '/examples',
          statusCode: 400,
          responseTime: expect.any(Number) as number,
        },
      },
      REQUEST_COMPLETED_MESSAGE,
    );
  });

  it('logs unknown errors at error with status 500', async () => {
    const { logger, error } = createLogger();
    const interceptor = new RequestLoggingInterceptor(
      logger,
      createHttpMetrics().httpMetrics,
    );

    await expect(
      firstValueFrom(
        interceptor.intercept(
          createHttpContext({ method: 'GET', path: '/boom' }),
          createCallHandler(new Error('boom')),
        ),
      ),
    ).rejects.toThrow('boom');

    expect(error).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalledWith(
      {
        access: {
          method: 'GET',
          url: '/boom',
          statusCode: 500,
          responseTime: expect.any(Number) as number,
        },
      },
      REQUEST_COMPLETED_MESSAGE,
    );
  });

  it('does not include headers or body in the log payload', async () => {
    const { logger, info } = createLogger();
    const interceptor = new RequestLoggingInterceptor(
      logger,
      createHttpMetrics().httpMetrics,
    );

    await firstValueFrom(
      interceptor.intercept(createHttpContext({}), createCallHandler('ok')),
    );

    const [payload] = info.mock.calls[0] as [RequestLogPayload];
    expect(payload).toBeDefined();
    expect(payload).not.toHaveProperty('headers');
    expect(payload).not.toHaveProperty('body');
    expect(payload.access).not.toHaveProperty('headers');
  });
});
