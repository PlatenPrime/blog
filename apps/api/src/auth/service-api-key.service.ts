import { createHash, timingSafeEqual } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { RootEnv } from '../config/env.schema';
import {
  INVALID_SERVICE_API_KEY_MESSAGE,
  SERVICE_API_KEY_ENV,
} from './service-api-key.constants';

@Injectable()
export class ServiceApiKeyService {
  constructor(private readonly config: ConfigService<RootEnv, true>) {}

  isConfigured(): boolean {
    return this.getConfiguredKey().length > 0;
  }

  validate(rawKey: string | null | undefined): true {
    const configuredKey = this.getConfiguredKey();
    const candidateKey = this.normalize(rawKey);

    if (
      configuredKey.length === 0 ||
      candidateKey.length === 0 ||
      !this.keysMatch(candidateKey, configuredKey)
    ) {
      throw new UnauthorizedException(INVALID_SERVICE_API_KEY_MESSAGE);
    }

    return true;
  }

  private getConfiguredKey(): string {
    return this.config.getOrThrow(SERVICE_API_KEY_ENV, { infer: true });
  }

  private normalize(rawKey: string | null | undefined): string {
    return typeof rawKey === 'string' ? rawKey.trim() : '';
  }

  private keysMatch(candidateKey: string, configuredKey: string): boolean {
    return timingSafeEqual(this.hash(candidateKey), this.hash(configuredKey));
  }

  private hash(value: string): Buffer {
    return createHash('sha256').update(value, 'utf8').digest();
  }
}
