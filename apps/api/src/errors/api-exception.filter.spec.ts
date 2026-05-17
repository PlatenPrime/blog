import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { HealthCheckError } from '@nestjs/terminus';
import {
  API_ERROR_CODE_INTERNAL,
  API_ERROR_CODE_NOT_FOUND,
} from '@blog/shared-contracts';
import { ApiExceptionFilter } from './api-exception.filter';

type MockResponse = {
  statusCode: number;
  body: unknown;
  status: (code: number) => MockResponse;
  json: (payload: unknown) => MockResponse;
};

function createMockResponse(): MockResponse {
  const response: MockResponse = {
    statusCode: 200,
    body: undefined,
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

describe('ApiExceptionFilter', () => {
  const httpAdapterHost = {
    httpAdapter: {
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

  it('writes ApiErrorBody envelope for HttpException', () => {
    const filter = new ApiExceptionFilter(httpAdapterHost);
    const response = createMockResponse();
    const host = createArgumentsHost(response);

    filter.catch(new NotFoundException('Missing resource'), host);

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({
      code: API_ERROR_CODE_NOT_FOUND,
      message: 'Missing resource',
    });
  });

  it('writes INTERNAL_ERROR envelope for unknown errors', () => {
    const filter = new ApiExceptionFilter(httpAdapterHost);
    const response = createMockResponse();
    const host = createArgumentsHost(response);

    filter.catch(new Error('secret db url'), host);

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({
      code: API_ERROR_CODE_INTERNAL,
      message: 'Internal server error',
    });
  });

  it('rethrows HealthCheckError for Terminus handling', () => {
    const filter = new ApiExceptionFilter(httpAdapterHost);
    const response = createMockResponse();
    const host = createArgumentsHost(response);
    const healthError = new HealthCheckError('Health check failed', {
      database: { status: 'down', message: 'connection refused' },
    });

    expect(() => filter.catch(healthError, host)).toThrow(healthError);
    expect(response.body).toBeUndefined();
  });

  it('does not leak stack traces in HttpException responses', () => {
    const filter = new ApiExceptionFilter(httpAdapterHost);
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
      code: 'BAD_REQUEST',
      message: 'Validation failed',
    });
    expect(JSON.stringify(response.body)).not.toContain('stack');
  });
});
