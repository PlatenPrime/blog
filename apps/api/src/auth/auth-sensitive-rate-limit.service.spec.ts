import { HttpException, HttpStatus } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { AUTH_SENSITIVE_RATE_LIMIT_MESSAGE } from './auth-sensitive-rate-limit.constants';
import { AUTH_SENSITIVE_RATE_SCOPE_PASSWORD_RESET } from './auth-sensitive-rate-limit-scope';
import { AuthSensitiveRateLimitService } from './auth-sensitive-rate-limit.service';

describe('AuthSensitiveRateLimitService', () => {
  const config = {
    getOrThrow: (key: string) => {
      if (key === 'AUTH_SENSITIVE_RATE_MAX_ATTEMPTS') {
        return 2;
      }
      if (key === 'AUTH_SENSITIVE_RATE_WINDOW_MS') {
        return 60_000;
      }
      if (key === 'AUTH_SENSITIVE_RATE_DURATION_MS') {
        return 120_000;
      }
      throw new Error(`unexpected config key: ${key}`);
    },
  };

  it('allows requests below maxAttempts', () => {
    const service = new AuthSensitiveRateLimitService(config as never);
    service.assertWithinLimits(
      AUTH_SENSITIVE_RATE_SCOPE_PASSWORD_RESET,
      'user@example.com',
      '203.0.113.1',
    );
    service.recordAttempt(
      AUTH_SENSITIVE_RATE_SCOPE_PASSWORD_RESET,
      'user@example.com',
      '203.0.113.1',
    );
    service.assertWithinLimits(
      AUTH_SENSITIVE_RATE_SCOPE_PASSWORD_RESET,
      'user@example.com',
      '203.0.113.1',
    );
  });

  it('throws 429 after maxAttempts on email bucket', () => {
    const service = new AuthSensitiveRateLimitService(config as never);
    const scope = AUTH_SENSITIVE_RATE_SCOPE_PASSWORD_RESET;
    const email = 'user@example.com';
    const ip = '203.0.113.10';

    service.recordAttempt(scope, email, ip);
    service.recordAttempt(scope, email, ip);

    expect(() => service.assertWithinLimits(scope, email, ip)).toThrow(
      new HttpException(
        AUTH_SENSITIVE_RATE_LIMIT_MESSAGE,
        HttpStatus.TOO_MANY_REQUESTS,
      ),
    );
  });

  it('keeps separate buckets per scope for the same email', () => {
    const service = new AuthSensitiveRateLimitService(config as never);
    const email = 'user@example.com';
    const ip = '203.0.113.2';

    service.recordAttempt(AUTH_SENSITIVE_RATE_SCOPE_PASSWORD_RESET, email, ip);
    service.recordAttempt(AUTH_SENSITIVE_RATE_SCOPE_PASSWORD_RESET, email, ip);

    service.assertWithinLimits('resend-verification', email, ip);
  });

  it('throws 429 when IP bucket is locked even if email differs', () => {
    const service = new AuthSensitiveRateLimitService(config as never);
    const scope = AUTH_SENSITIVE_RATE_SCOPE_PASSWORD_RESET;
    const ip = '203.0.113.3';

    service.recordAttempt(scope, 'a@example.com', ip);
    service.recordAttempt(scope, 'b@example.com', ip);

    expect(() =>
      service.assertWithinLimits(scope, 'c@example.com', ip),
    ).toThrow(HttpException);
  });
});
