import {
  API_ERROR_CODE_BAD_REQUEST,
  API_ERROR_CODE_CONFLICT,
  API_ERROR_CODE_FORBIDDEN,
  API_ERROR_CODE_INTERNAL,
  API_ERROR_CODE_NOT_FOUND,
  API_ERROR_CODE_UNAUTHORIZED,
  API_ERROR_CODE_VALIDATION,
  API_INTERNAL_ERROR_MESSAGE,
  type ApiErrorBody,
  type ApiErrorCode,
  type ApiErrorDetails,
} from '@blog/shared-contracts';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

export type MappedApiError = {
  readonly status: number;
  readonly body: ApiErrorBody;
};

export type MapExceptionToApiErrorOptions = {
  readonly requestId?: string;
};

export function mapExceptionToApiError(
  exception: unknown,
  options: MapExceptionToApiErrorOptions = {},
): MappedApiError {
  const { requestId } = options;

  if (exception instanceof HttpException) {
    return withRequestId(mapHttpException(exception), requestId);
  }

  return withRequestId(
    {
      status: 500,
      body: {
        code: API_ERROR_CODE_INTERNAL,
        message: API_INTERNAL_ERROR_MESSAGE,
      },
    },
    requestId,
  );
}

function withRequestId(
  mapped: MappedApiError,
  requestId: string | undefined,
): MappedApiError {
  if (requestId === undefined) {
    return mapped;
  }

  return {
    ...mapped,
    body: {
      ...mapped.body,
      requestId,
    },
  };
}

function mapHttpException(exception: HttpException): MappedApiError {
  const status = exception.getStatus();
  const validationDetails = extractValidationDetails(exception);

  if (validationDetails !== undefined) {
    return {
      status,
      body: {
        code: API_ERROR_CODE_VALIDATION,
        message: extractValidationMessage(exception),
        details: validationDetails,
      },
    };
  }

  const message = resolveClientErrorMessage(
    status,
    extractHttpExceptionMessage(exception),
  );

  return {
    status,
    body: {
      code: resolveApiErrorCode(exception, status),
      message,
    },
  };
}

function resolveClientErrorMessage(status: number, message: string): string {
  if (status >= 500) {
    return API_INTERNAL_ERROR_MESSAGE;
  }

  return message;
}

function extractValidationDetails(
  exception: HttpException,
): ApiErrorDetails | undefined {
  const response = exception.getResponse();

  if (
    typeof response === 'object' &&
    response !== null &&
    'details' in response &&
    isApiErrorDetails((response as { details?: unknown }).details)
  ) {
    return (response as { details: ApiErrorDetails }).details;
  }

  return undefined;
}

function isApiErrorDetails(value: unknown): value is ApiErrorDetails {
  if (!Array.isArray(value) || value.length === 0) {
    return Array.isArray(value);
  }

  return value.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      'field' in item &&
      'message' in item &&
      typeof (item as { field: unknown }).field === 'string' &&
      typeof (item as { message: unknown }).message === 'string',
  );
}

function extractValidationMessage(exception: HttpException): string {
  const response = exception.getResponse();

  if (
    typeof response === 'object' &&
    response !== null &&
    'message' in response &&
    typeof (response as { message?: unknown }).message === 'string'
  ) {
    return (response as { message: string }).message;
  }

  return 'Validation failed';
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
