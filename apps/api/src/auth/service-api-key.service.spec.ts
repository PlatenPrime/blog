import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RootEnv } from '../config/env.schema';
import {
  INVALID_SERVICE_API_KEY_MESSAGE,
  SERVICE_API_KEY_ENV,
} from './service-api-key.constants';
import { ServiceApiKeyService } from './service-api-key.service';

const configuredKey = 'service-api-key-with-at-least-32-characters';

describe('ServiceApiKeyService', () => {
  let getOrThrow: ReturnType<typeof vi.fn>;
  let config: ConfigService<RootEnv, true>;

  function createService(serviceApiKey: string): ServiceApiKeyService {
    getOrThrow = vi.fn((key: keyof RootEnv) => {
      if (key === SERVICE_API_KEY_ENV) {
        return serviceApiKey;
      }
      throw new Error(`Unexpected config key: ${String(key)}`);
    });
    config = { getOrThrow } as unknown as ConfigService<RootEnv, true>;
    return new ServiceApiKeyService(config);
  }

  beforeEach(() => {
    getOrThrow = vi.fn();
  });

  it('reports unconfigured when SERVICE_API_KEY is empty', () => {
    const service = createService('');

    expect(service.isConfigured()).toBe(false);
  });

  it('rejects all keys when SERVICE_API_KEY is not configured', () => {
    const service = createService('');

    expect(() => service.validate(configuredKey)).toThrow(
      new UnauthorizedException(INVALID_SERVICE_API_KEY_MESSAGE),
    );
  });

  it('accepts the configured service API key', () => {
    const service = createService(configuredKey);

    expect(service.isConfigured()).toBe(true);
    expect(service.validate(configuredKey)).toBe(true);
  });

  it('trims incoming header values before validation', () => {
    const service = createService(configuredKey);

    expect(service.validate(`  ${configuredKey}  `)).toBe(true);
  });

  it('rejects missing, empty, and mismatched keys with a neutral error', () => {
    const service = createService(configuredKey);

    expect(() => service.validate(undefined)).toThrow(
      new UnauthorizedException(INVALID_SERVICE_API_KEY_MESSAGE),
    );
    expect(() => service.validate('')).toThrow(
      new UnauthorizedException(INVALID_SERVICE_API_KEY_MESSAGE),
    );
    expect(() => service.validate('wrong-key')).toThrow(
      new UnauthorizedException(INVALID_SERVICE_API_KEY_MESSAGE),
    );
  });

  it('handles short mismatched keys without leaking comparison details', () => {
    const service = createService(configuredKey);

    expect(() => service.validate('short')).toThrow(
      new UnauthorizedException(INVALID_SERVICE_API_KEY_MESSAGE),
    );
  });
});
