import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  API_ERROR_CODE_BAD_REQUEST,
  API_ERROR_CODE_CONFLICT,
  API_ERROR_CODE_FORBIDDEN,
  API_ERROR_CODE_INTERNAL,
  API_ERROR_CODE_NOT_FOUND,
  API_ERROR_CODE_UNAUTHORIZED,
  API_ERROR_CODE_VALIDATION,
  API_INTERNAL_ERROR_MESSAGE,
} from '@blog/shared-contracts';
import { mapExceptionToApiError } from './map-exception-to-api-error';

describe('mapExceptionToApiError', () => {
  it('maps NotFoundException to 404 NOT_FOUND', () => {
    const exception = new NotFoundException('User not found');

    expect(mapExceptionToApiError(exception)).toEqual({
      status: 404,
      body: {
        code: API_ERROR_CODE_NOT_FOUND,
        message: 'User not found',
      },
    });
  });

  it('maps UnauthorizedException to 401 UNAUTHORIZED', () => {
    const exception = new UnauthorizedException('Invalid token');

    expect(mapExceptionToApiError(exception)).toEqual({
      status: 401,
      body: {
        code: API_ERROR_CODE_UNAUTHORIZED,
        message: 'Invalid token',
      },
    });
  });

  it('maps ForbiddenException to 403 FORBIDDEN', () => {
    const exception = new ForbiddenException('Access denied');

    expect(mapExceptionToApiError(exception)).toEqual({
      status: 403,
      body: {
        code: API_ERROR_CODE_FORBIDDEN,
        message: 'Access denied',
      },
    });
  });

  it('maps BadRequestException to 400 BAD_REQUEST', () => {
    const exception = new BadRequestException('Invalid payload');

    expect(mapExceptionToApiError(exception)).toEqual({
      status: 400,
      body: {
        code: API_ERROR_CODE_BAD_REQUEST,
        message: 'Invalid payload',
      },
    });
  });

  it('maps ConflictException to 409 CONFLICT', () => {
    const exception = new ConflictException('Email already exists');

    expect(mapExceptionToApiError(exception)).toEqual({
      status: 409,
      body: {
        code: API_ERROR_CODE_CONFLICT,
        message: 'Email already exists',
      },
    });
  });

  it('maps BadRequestException with details to VALIDATION_FAILED', () => {
    const exception = new BadRequestException({
      message: 'Validation failed',
      details: [
        {
          field: 'count',
          message: 'count must not be less than 1',
          code: 'min',
        },
      ],
    });

    expect(mapExceptionToApiError(exception)).toEqual({
      status: 400,
      body: {
        code: API_ERROR_CODE_VALIDATION,
        message: 'Validation failed',
        details: [
          {
            field: 'count',
            message: 'count must not be less than 1',
            code: 'min',
          },
        ],
      },
    });
  });

  it('joins array messages from HttpException object response', () => {
    const exception = new BadRequestException({
      message: ['email must be an email', 'name should not be empty'],
      error: 'Bad Request',
    });

    expect(mapExceptionToApiError(exception)).toEqual({
      status: 400,
      body: {
        code: API_ERROR_CODE_BAD_REQUEST,
        message: 'email must be an email; name should not be empty',
      },
    });
  });

  it('maps generic HttpException status to platform code', () => {
    const exception = new HttpException('I am a teapot', 418);

    expect(mapExceptionToApiError(exception)).toEqual({
      status: 418,
      body: {
        code: API_ERROR_CODE_BAD_REQUEST,
        message: 'I am a teapot',
      },
    });
  });

  it('maps unknown Error to 500 INTERNAL_ERROR with safe message', () => {
    const exception = new Error('database connection string leaked');

    expect(mapExceptionToApiError(exception)).toEqual({
      status: 500,
      body: {
        code: API_ERROR_CODE_INTERNAL,
        message: API_INTERNAL_ERROR_MESSAGE,
      },
    });
  });

  it('maps non-Error unknown values to 500 INTERNAL_ERROR', () => {
    expect(mapExceptionToApiError('unexpected')).toEqual({
      status: 500,
      body: {
        code: API_ERROR_CODE_INTERNAL,
        message: API_INTERNAL_ERROR_MESSAGE,
      },
    });
  });

  it('sanitizes HttpException 500 message to generic INTERNAL_ERROR detail', () => {
    const exception = new HttpException('secret db url', 500);

    expect(mapExceptionToApiError(exception)).toEqual({
      status: 500,
      body: {
        code: API_ERROR_CODE_INTERNAL,
        message: API_INTERNAL_ERROR_MESSAGE,
      },
    });
  });

  it('sanitizes InternalServerErrorException message', () => {
    const exception = new InternalServerErrorException('connection refused');

    expect(mapExceptionToApiError(exception)).toEqual({
      status: 500,
      body: {
        code: API_ERROR_CODE_INTERNAL,
        message: API_INTERNAL_ERROR_MESSAGE,
      },
    });
  });

  it('does not leak stack or internal message from 500 object response', () => {
    const exception = new HttpException(
      {
        message: 'leak',
        stack: 'at foo (secret.ts:1:1)',
      },
      500,
    );

    const result = mapExceptionToApiError(exception);
    const serialized = JSON.stringify(result.body);

    expect(result).toEqual({
      status: 500,
      body: {
        code: API_ERROR_CODE_INTERNAL,
        message: API_INTERNAL_ERROR_MESSAGE,
      },
    });
    expect(serialized).not.toContain('stack');
    expect(serialized).not.toContain('leak');
  });

  it('keeps 404 NotFoundException client message unchanged', () => {
    const exception = new NotFoundException('Missing resource');

    expect(mapExceptionToApiError(exception)).toEqual({
      status: 404,
      body: {
        code: API_ERROR_CODE_NOT_FOUND,
        message: 'Missing resource',
      },
    });
  });
});
