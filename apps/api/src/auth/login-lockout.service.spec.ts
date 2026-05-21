import { HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LOGIN_LOCKOUT_MESSAGE } from './login-lockout.constants';
import { LoginLockoutService } from './login-lockout.service';

describe('LoginLockoutService', () => {
  let service: LoginLockoutService;

  beforeEach(() => {
    const config = {
      getOrThrow: vi.fn((key: string) => {
        if (key === 'LOGIN_LOCKOUT_MAX_ATTEMPTS') {
          return 2;
        }
        if (key === 'LOGIN_LOCKOUT_WINDOW_MS') {
          return 60_000;
        }
        if (key === 'LOGIN_LOCKOUT_DURATION_MS') {
          return 120_000;
        }
        throw new Error(`unexpected config key: ${key}`);
      }),
    } as unknown as ConfigService;
    service = new LoginLockoutService(config);
  });

  it('assertNotLocked resolves when no failures recorded', () => {
    expect(() => service.assertNotLocked('user@example.com')).not.toThrow();
  });

  it('throws 429 after maxAttempts failures', () => {
    service.recordFailure('user@example.com');
    service.recordFailure('user@example.com');

    expect(() => service.assertNotLocked('user@example.com')).toThrow(
      new HttpException(LOGIN_LOCKOUT_MESSAGE, HttpStatus.TOO_MANY_REQUESTS),
    );
  });

  it('clear removes lockout for email', () => {
    service.recordFailure('user@example.com');
    service.recordFailure('user@example.com');
    service.clear('user@example.com');

    expect(() => service.assertNotLocked('user@example.com')).not.toThrow();
  });

  it('normalizes email key for record and assert', () => {
    service.recordFailure('  User@Example.COM ');
    service.recordFailure('user@example.com');

    expect(() => service.assertNotLocked('USER@example.com')).toThrow(
      HttpException,
    );
  });
});
