import {
  ExecutionContext,
  UnauthorizedException,
  type Type,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  INVALID_SERVICE_API_KEY_MESSAGE,
  SERVICE_API_KEY_HEADER,
} from './service-api-key.constants';
import { ServiceApiKeyGuard } from './service-api-key.guard';
import { ServiceApiKeyService } from './service-api-key.service';

function createExecutionContext(
  headerValue: string | string[] | undefined,
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers:
          headerValue === undefined
            ? {}
            : { [SERVICE_API_KEY_HEADER]: headerValue },
      }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}) as Type<unknown>,
  } as ExecutionContext;
}

describe('ServiceApiKeyGuard', () => {
  let guard: ServiceApiKeyGuard;
  let validate: ReturnType<typeof vi.fn>;
  let serviceApiKeys: ServiceApiKeyService;

  beforeEach(() => {
    validate = vi.fn().mockReturnValue(true);
    serviceApiKeys = { validate } as unknown as ServiceApiKeyService;
    guard = new ServiceApiKeyGuard(serviceApiKeys);
  });

  it('allows the request when the service key is valid', () => {
    expect(guard.canActivate(createExecutionContext('valid-key'))).toBe(true);

    expect(validate).toHaveBeenCalledWith('valid-key');
  });

  it('uses the first header value when Node provides an array', () => {
    expect(
      guard.canActivate(createExecutionContext(['first-key', 'second-key'])),
    ).toBe(true);

    expect(validate).toHaveBeenCalledWith('first-key');
  });

  it('passes null to validation when the service key header is missing', () => {
    expect(guard.canActivate(createExecutionContext(undefined))).toBe(true);

    expect(validate).toHaveBeenCalledWith(null);
  });

  it('propagates neutral UnauthorizedException from validation', () => {
    validate.mockImplementation(() => {
      throw new UnauthorizedException(INVALID_SERVICE_API_KEY_MESSAGE);
    });

    expect(() => guard.canActivate(createExecutionContext('bad-key'))).toThrow(
      new UnauthorizedException(INVALID_SERVICE_API_KEY_MESSAGE),
    );
  });
});
