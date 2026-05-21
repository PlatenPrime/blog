import { describe, expect, it } from 'vitest';
import {
  isLoginLocked,
  nextStateAfterFailure,
  normalizeLockoutKey,
  type LoginLockoutPolicy,
} from './login-lockout-state';

const policy: LoginLockoutPolicy = {
  maxAttempts: 3,
  windowMs: 60_000,
  durationMs: 120_000,
};

describe('normalizeLockoutKey', () => {
  it('trims and lowercases email', () => {
    expect(normalizeLockoutKey('  User@Example.COM ')).toBe('user@example.com');
  });
});

describe('isLoginLocked', () => {
  it('returns false when state is undefined', () => {
    expect(isLoginLocked(undefined, 1_000)).toBe(false);
  });

  it('returns true while lockedUntil is in the future', () => {
    expect(
      isLoginLocked(
        { failures: 3, firstFailureAt: 0, lockedUntil: 5_000 },
        4_000,
      ),
    ).toBe(true);
  });

  it('returns false after lockout expires', () => {
    expect(
      isLoginLocked(
        { failures: 3, firstFailureAt: 0, lockedUntil: 5_000 },
        5_000,
      ),
    ).toBe(false);
  });
});

describe('nextStateAfterFailure', () => {
  it('starts a new streak on first failure', () => {
    const state = nextStateAfterFailure(undefined, 1_000, policy);
    expect(state).toEqual({ failures: 1, firstFailureAt: 1_000 });
  });

  it('increments failures within the window', () => {
    const first = nextStateAfterFailure(undefined, 1_000, policy);
    const second = nextStateAfterFailure(first, 2_000, policy);
    expect(second).toEqual({ failures: 2, firstFailureAt: 1_000 });
  });

  it('locks when failures reach maxAttempts', () => {
    let state = nextStateAfterFailure(undefined, 1_000, policy);
    state = nextStateAfterFailure(state, 2_000, policy);
    state = nextStateAfterFailure(state, 3_000, policy);
    expect(state).toEqual({
      failures: 3,
      firstFailureAt: 1_000,
      lockedUntil: 3_000 + policy.durationMs,
    });
  });

  it('resets streak when window expired', () => {
    const stale = nextStateAfterFailure(undefined, 1_000, policy);
    const staleSecond = nextStateAfterFailure(stale, 2_000, policy);
    const afterWindow = nextStateAfterFailure(
      staleSecond,
      1_000 + policy.windowMs + 1,
      policy,
    );
    expect(afterWindow).toEqual({
      failures: 1,
      firstFailureAt: 1_000 + policy.windowMs + 1,
    });
  });

  it('starts fresh streak after lockout expires', () => {
    const locked = {
      failures: 3,
      firstFailureAt: 1_000,
      lockedUntil: 10_000,
    };
    const afterLock = nextStateAfterFailure(locked, 10_000, policy);
    expect(afterLock).toEqual({ failures: 1, firstFailureAt: 10_000 });
  });
});
