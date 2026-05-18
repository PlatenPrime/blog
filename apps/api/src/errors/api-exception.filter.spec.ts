import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { HealthCheckError } from '@nestjs/terminus';
import {
  API_ERROR_CODE_BAD_REQUEST,
  API_ERROR_CODE_INTERNAL,
  API_ERROR_CODE_NOT_FOUND,
  API_INTERNAL_ERROR_MESSAGE,
  PROBLEM_MEDIA_TYPE,
  problemTypeUriForCode,
} from '@blog/shared-contracts';
import type { PinoLogger } from 'nestjs-pino';
import { describe, expect, it, vi } from 'vitest';
import { RequestContextStore } from '../common/request-context';
import { ApiExceptionFilter } from './api-exception.filter';

type MockResponse = {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
  status: (code: number) => MockResponse;
  json: (payload: unknown) => MockResponse;
};

function createMockResponse(): MockResponse {
  const response: MockResponse = {
    statusCode: 200,
    body: undefined,
    headers: {},
    status(code: number) {
      response.statusCode = code;
      return response;
    },
    json(payload: unknown) {
      response.body = payload;
      return response;
    },
  };

  return response;
}

function createArgumentsHost(response: MockResponse): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({}),
      getNext: () => undefined,
    }),
  } as ArgumentsHost;
}

const httpAdapterHost = {
  httpAdapter: {
    setHeader: (response: MockResponse, name: string, value: string): void => {
      response.headers[name.toLowerCase()] = value;
    },
    reply: (
      response: MockResponse,
      body: unknown,
      statusCode: number,
    ): void => {
      response.status(statusCode);
      response.json(body);
    },
  },
} as HttpAdapterHost;

function createFilter(requestId?: string): {
  filter: ApiExceptionFilter;
  logger: { error: ReturnType<typeof vi.fn> };
} {
  const logger = {
    error: vi.fn(),
    setContext: vi.fn(),
  };
  const requestContextStore = {
    getRequestId: () => requestId,
  } as RequestContextStore;

  return {
    logger,
    filter: new ApiExceptionFilter(
      logger as unknown as PinoLogger,
      httpAdapterHost,
      requestContextStore,
    ),
  };
}

describe('ApiExceptionFilter', () => {
  it('writes Problem Details envelope for HttpException', () => {
    const { filter } = createFilter();
    const response = createMockResponse();
    const host = createArgumentsHost(response);

    filter.catch(new NotFoundException('Missing resource'), host);

    expect(response.statusCode).toBe(404);
    expect(response.headers['content-type']).toBe(PROBLEM_MEDIA_TYPE);
    expect(response.body).toEqual({
      type: problemTypeUriForCode(API_ERROR_CODE_NOT_FOUND),
      title: 'Not Found',
      status: 404,
      detail: 'Missing resource',
      code: API_ERROR_CODE_NOT_FOUND,
    });
  });

  it('writes INTERNAL_ERROR Problem Details for unknown errors', () => {
    const { filter, logger } = createFilter();
    const response = createMockResponse();
    const host = createArgumentsHost(response);

    filter.catch(new Error('secret db url'), host);

    expect(logger.error).toHaveBeenCalledOnce();
    const call = logger.error.mock.calls[0];
    expect(call?.[1]).toBe('Unhandled exception');
    expect(call?.[0]).toMatchObject({
      err: { message: 'secret db url' },
    });

    expect(response.statusCode).toBe(500);
    expect(response.headers['content-type']).toBe(PROBLEM_MEDIA_TYPE);
    expect(response.body).toEqual({
      type: problemTypeUriForCode(API_ERROR_CODE_INTERNAL),
      title: 'Internal Server Error',
      status: 500,
      detail: API_INTERNAL_ERROR_MESSAGE,
      code: API_ERROR_CODE_INTERNAL,
    });

    const serialized = JSON.stringify(response.body);
    expect(serialized).not.toContain('stack');
    expect(serialized).not.toContain('secret db url');
  });

  it('sanitizes 500 HttpException Problem Details without leaking message', () => {
    const { filter } = createFilter();
    const response = createMockResponse();
    const host = createArgumentsHost(response);

    filter.catch(
      new HttpException('secret db url', HttpStatus.INTERNAL_SERVER_ERROR),
      host,
    );

    expect(response.statusCode).toBe(500);
    expect(response.headers['content-type']).toBe(PROBLEM_MEDIA_TYPE);
    expect(response.body).toEqual({
      type: problemTypeUriForCode(API_ERROR_CODE_INTERNAL),
      title: 'Internal Server Error',
      status: 500,
      detail: API_INTERNAL_ERROR_MESSAGE,
      code: API_ERROR_CODE_INTERNAL,
    });

    const serialized = JSON.stringify(response.body);
    expect(serialized).not.toContain('stack');
    expect(serialized).not.toContain('secret db url');
  });

  it('rethrows HealthCheckError for Terminus handling', () => {
    const { filter } = createFilter();
    const response = createMockResponse();
    const host = createArgumentsHost(response);
    const healthError = new HealthCheckError('Health check failed', {
      database: { status: 'down', message: 'connection refused' },
    });

    expect(() => filter.catch(healthError, host)).toThrow(healthError);
    expect(response.body).toBeUndefined();
  });

  it('includes requestId as instance when present in request context', () => {
    const { filter } = createFilter('req-filter-1');
    const response = createMockResponse();
    const host = createArgumentsHost(response);

    filter.catch(new NotFoundException('Missing resource'), host);

    expect(response.body).toEqual({
      type: problemTypeUriForCode(API_ERROR_CODE_NOT_FOUND),
      title: 'Not Found',
      status: 404,
      detail: 'Missing resource',
      code: API_ERROR_CODE_NOT_FOUND,
      instance: 'req-filter-1',
    });
  });

  it('does not leak stack traces in HttpException responses', () => {
    const { filter } = createFilter();
    const response = createMockResponse();
    const host = createArgumentsHost(response);
    const exception = new HttpException(
      {
        message: 'Validation failed',
        error: 'Bad Request',
        statusCode: 400,
      },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, host);

    expect(response.body).toEqual({
      type: problemTypeUriForCode(API_ERROR_CODE_BAD_REQUEST),
      title: 'Bad Request',
      status: 400,
      detail: 'Validation failed',
      code: API_ERROR_CODE_BAD_REQUEST,
    });
    expect(JSON.stringify(response.body)).not.toContain('stack');
  });
});
