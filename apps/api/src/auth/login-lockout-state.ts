import { normalizeUserEmail } from '../users/normalize-user-email';

export type LoginLockoutState = {
  readonly failures: number;
  readonly firstFailureAt: number;
  readonly lockedUntil?: number;
};

export type LoginLockoutPolicy = {
  readonly maxAttempts: number;
  readonly windowMs: number;
  readonly durationMs: number;
};

export function normalizeLockoutKey(email: string): string {
  return normalizeUserEmail(email);
}

export function isLoginLocked(
  state: LoginLockoutState | undefined,
  now: number,
): boolean {
  if (state === undefined) {
    return false;
  }

  if (state.lockedUntil !== undefined && now < state.lockedUntil) {
    return true;
  }

  return false;
}

function isWindowExpired(
  state: LoginLockoutState,
  now: number,
  windowMs: number,
): boolean {
  return now - state.firstFailureAt > windowMs;
}

function isStreakActive(
  state: LoginLockoutState,
  now: number,
  windowMs: number,
): boolean {
  if (state.lockedUntil !== undefined) {
    return false;
  }

  return !isWindowExpired(state, now, windowMs);
}

export function nextStateAfterFailure(
  state: LoginLockoutState | undefined,
  now: number,
  policy: LoginLockoutPolicy,
): LoginLockoutState {
  const active =
    state !== undefined && isStreakActive(state, now, policy.windowMs)
      ? state
      : undefined;

  const failures = (active?.failures ?? 0) + 1;
  const firstFailureAt = active?.firstFailureAt ?? now;

  if (failures >= policy.maxAttempts) {
    return {
      failures,
      firstFailureAt,
      lockedUntil: now + policy.durationMs,
    };
  }

  return { failures, firstFailureAt };
}
