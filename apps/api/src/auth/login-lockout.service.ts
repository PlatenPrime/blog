import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LOGIN_LOCKOUT_MESSAGE } from './login-lockout.constants';
import {
  isLoginLocked,
  nextStateAfterFailure,
  normalizeLockoutKey,
  type LoginLockoutPolicy,
  type LoginLockoutState,
} from './login-lockout-state';

export type LoginLockoutConfig = LoginLockoutPolicy;

@Injectable()
export class LoginLockoutService {
  private readonly policy: LoginLockoutPolicy;
  private readonly store = new Map<string, LoginLockoutState>();

  constructor(config: ConfigService) {
    this.policy = {
      maxAttempts: config.getOrThrow<number>('LOGIN_LOCKOUT_MAX_ATTEMPTS'),
      windowMs: config.getOrThrow<number>('LOGIN_LOCKOUT_WINDOW_MS'),
      durationMs: config.getOrThrow<number>('LOGIN_LOCKOUT_DURATION_MS'),
    };
  }

  assertNotLocked(email: string): void {
    const key = normalizeLockoutKey(email);
    const state = this.store.get(key);

    if (isLoginLocked(state, Date.now())) {
      throw new HttpException(
        LOGIN_LOCKOUT_MESSAGE,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  recordFailure(email: string): boolean {
    const key = normalizeLockoutKey(email);
    const now = Date.now();
    const previous = this.store.get(key);
    const wasLocked = isLoginLocked(previous, now);
    const next = nextStateAfterFailure(previous, now, this.policy);
    this.store.set(key, next);
    return !wasLocked && isLoginLocked(next, now);
  }

  clear(email: string): void {
    this.store.delete(normalizeLockoutKey(email));
  }
}
