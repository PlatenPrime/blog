import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { normalizeUserEmail } from '../users/normalize-user-email';
import {
  isRateLimited,
  nextStateAfterAttempt,
  type RateLimitPolicy,
  type RateLimitState,
} from '../rate-limit/rate-limit-state';
import { AUTH_SENSITIVE_RATE_LIMIT_MESSAGE } from './auth-sensitive-rate-limit.constants';
import type { AuthSensitiveRateLimitScope } from './auth-sensitive-rate-limit-scope';

type RateLimitDimension = 'email' | 'ip';

@Injectable()
export class AuthSensitiveRateLimitService {
  private readonly policy: RateLimitPolicy;
  private readonly store = new Map<string, RateLimitState>();

  constructor(config: ConfigService) {
    this.policy = {
      maxAttempts: config.getOrThrow<number>(
        'AUTH_SENSITIVE_RATE_MAX_ATTEMPTS',
      ),
      windowMs: config.getOrThrow<number>('AUTH_SENSITIVE_RATE_WINDOW_MS'),
      durationMs: config.getOrThrow<number>('AUTH_SENSITIVE_RATE_DURATION_MS'),
    };
  }

  assertWithinLimits(
    scope: AuthSensitiveRateLimitScope,
    email: string,
    clientIp: string,
  ): void {
    const now = Date.now();
    const keys = [
      this.storeKey(scope, 'email', normalizeUserEmail(email)),
      this.storeKey(scope, 'ip', normalizeClientIpKey(clientIp)),
    ];

    for (const key of keys) {
      if (isRateLimited(this.store.get(key), now)) {
        throw new HttpException(
          AUTH_SENSITIVE_RATE_LIMIT_MESSAGE,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }
  }

  recordAttempt(
    scope: AuthSensitiveRateLimitScope,
    email: string,
    clientIp: string,
  ): void {
    const now = Date.now();
    this.recordForKey(
      this.storeKey(scope, 'email', normalizeUserEmail(email)),
      now,
    );
    this.recordForKey(
      this.storeKey(scope, 'ip', normalizeClientIpKey(clientIp)),
      now,
    );
  }

  private recordForKey(key: string, now: number): void {
    const previous = this.store.get(key);
    const next = nextStateAfterAttempt(previous, now, this.policy);
    this.store.set(key, next);
  }

  private storeKey(
    scope: AuthSensitiveRateLimitScope,
    dimension: RateLimitDimension,
    normalizedKey: string,
  ): string {
    return `${scope}:${dimension}:${normalizedKey}`;
  }
}

function normalizeClientIpKey(clientIp: string): string {
  const trimmed = clientIp.trim();
  return trimmed.length === 0 ? 'unknown' : trimmed;
}
