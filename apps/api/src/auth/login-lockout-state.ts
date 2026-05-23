import { normalizeUserEmail } from '../users/normalize-user-email';
import {
  isRateLimited,
  nextStateAfterAttempt,
  type RateLimitPolicy,
  type RateLimitState,
} from '../rate-limit/rate-limit-state';

export type LoginLockoutState = {
  readonly failures: number;
  readonly firstFailureAt: number;
  readonly lockedUntil?: number;
};

export type LoginLockoutPolicy = RateLimitPolicy;

export function normalizeLockoutKey(email: string): string {
  return normalizeUserEmail(email);
}

function toLoginState(state: RateLimitState): LoginLockoutState {
  return {
    failures: state.attempts,
    firstFailureAt: state.firstAttemptAt,
    ...(state.lockedUntil !== undefined
      ? { lockedUntil: state.lockedUntil }
      : {}),
  };
}

function fromLoginState(
  state: LoginLockoutState | undefined,
): RateLimitState | undefined {
  if (state === undefined) {
    return undefined;
  }

  return {
    attempts: state.failures,
    firstAttemptAt: state.firstFailureAt,
    lockedUntil: state.lockedUntil,
  };
}

export function isLoginLocked(
  state: LoginLockoutState | undefined,
  now: number,
): boolean {
  return isRateLimited(fromLoginState(state), now);
}

export function nextStateAfterFailure(
  state: LoginLockoutState | undefined,
  now: number,
  policy: LoginLockoutPolicy,
): LoginLockoutState {
  return toLoginState(
    nextStateAfterAttempt(fromLoginState(state), now, policy),
  );
}
