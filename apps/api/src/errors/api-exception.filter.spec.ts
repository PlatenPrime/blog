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

describe('ApiExceptionFilter', () => {
  const httpAdapterHost = {
    httpAdapter: {
      setHeader: (
        response: MockResponse,
        name: string,
        value: string,
      ): void => {
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

  it('writes Problem Details envelope for HttpException', () => {
    const filter = new ApiExceptionFilter(httpAdapterHost);
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
    const filter = new ApiExceptionFilter(httpAdapterHost);
    const response = createMockResponse();
    const host = createArgumentsHost(response);

    filter.catch(new Error('secret db url'), host);

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
    const filter = new ApiExceptionFilter(httpAdapterHost);
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
      type: problemTypeUriForCode(API_ERROR_CODE_BAD_REQUEST),
      title: 'Bad Request',
      status: 400,
      detail: 'Validation failed',
      code: API_ERROR_CODE_BAD_REQUEST,
    });
    expect(JSON.stringify(response.body)).not.toContain('stack');
  });
});
