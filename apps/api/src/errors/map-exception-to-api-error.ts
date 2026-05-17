import {
  API_ERROR_CODE_BAD_REQUEST,
  API_ERROR_CODE_CONFLICT,
  API_ERROR_CODE_FORBIDDEN,
  API_ERROR_CODE_INTERNAL,
  API_ERROR_CODE_NOT_FOUND,
  API_ERROR_CODE_UNAUTHORIZED,
  type ApiErrorBody,
  type ApiErrorCode,
} from '@blog/shared-contracts';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

const INTERNAL_ERROR_MESSAGE = 'Internal server error';

export type MappedApiError = {
  readonly status: number;
  readonly body: ApiErrorBody;
};

export function mapExceptionToApiError(exception: unknown): MappedApiError {
  if (exception instanceof HttpException) {
    return mapHttpException(exception);
  }

  return {
    status: 500,
    body: {
      code: API_ERROR_CODE_INTERNAL,
      message: INTERNAL_ERROR_MESSAGE,
    },
  };
}

function mapHttpException(exception: HttpException): MappedApiError {
  const status = exception.getStatus();
  const message = extractHttpExceptionMessage(exception);

  return {
    status,
    body: {
      code: resolveApiErrorCode(exception, status),
      message,
    },
  };
}

function resolveApiErrorCode(
  exception: HttpException,
  status: number,
): ApiErrorCode {
  if (exception instanceof NotFoundException) {
    return API_ERROR_CODE_NOT_FOUND;
  }

  if (exception instanceof UnauthorizedException) {
    return API_ERROR_CODE_UNAUTHORIZED;
  }

  if (exception instanceof ForbiddenException) {
    return API_ERROR_CODE_FORBIDDEN;
  }

  if (exception instanceof BadRequestException) {
    return API_ERROR_CODE_BAD_REQUEST;
  }

  if (exception instanceof ConflictException) {
    return API_ERROR_CODE_CONFLICT;
  }

  return resolveApiErrorCodeFromStatus(status);
}

function resolveApiErrorCodeFromStatus(status: number): ApiErrorCode {
  if (status === 404) {
    return API_ERROR_CODE_NOT_FOUND;
  }

  if (status === 401) {
    return API_ERROR_CODE_UNAUTHORIZED;
  }

  if (status === 403) {
    return API_ERROR_CODE_FORBIDDEN;
  }

  if (status === 409) {
    return API_ERROR_CODE_CONFLICT;
  }

  if (status >= 500) {
    return API_ERROR_CODE_INTERNAL;
  }

  return API_ERROR_CODE_BAD_REQUEST;
}

function extractHttpExceptionMessage(exception: HttpException): string {
  const response = exception.getResponse();

  if (typeof response === 'string') {
    return response;
  }

  if (
    typeof response === 'object' &&
    response !== null &&
    'message' in response
  ) {
    const { message } = response as { message?: string | string[] };

    if (typeof message === 'string') {
      return message;
    }

    if (Array.isArray(message)) {
      return message.join('; ');
    }
  }

  return exception.message;
}
