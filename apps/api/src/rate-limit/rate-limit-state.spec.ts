import { describe, expect, it } from 'vitest';
import {
  isRateLimited,
  nextStateAfterAttempt,
  type RateLimitPolicy,
} from './rate-limit-state';

const policy: RateLimitPolicy = {
  maxAttempts: 3,
  windowMs: 60_000,
  durationMs: 120_000,
};

describe('isRateLimited', () => {
  it('returns false when state is undefined', () => {
    expect(isRateLimited(undefined, 1_000)).toBe(false);
  });

  it('returns true while lockedUntil is in the future', () => {
    expect(
      isRateLimited(
        { attempts: 3, firstAttemptAt: 0, lockedUntil: 5_000 },
        4_000,
      ),
    ).toBe(true);
  });

  it('returns false after lockout expires', () => {
    expect(
      isRateLimited(
        { attempts: 3, firstAttemptAt: 0, lockedUntil: 5_000 },
        5_000,
      ),
    ).toBe(false);
  });
});

describe('nextStateAfterAttempt', () => {
  it('starts a new streak on first attempt', () => {
    const state = nextStateAfterAttempt(undefined, 1_000, policy);
    expect(state).toEqual({ attempts: 1, firstAttemptAt: 1_000 });
  });

  it('increments attempts within the window', () => {
    const first = nextStateAfterAttempt(undefined, 1_000, policy);
    const second = nextStateAfterAttempt(first, 2_000, policy);
    expect(second).toEqual({ attempts: 2, firstAttemptAt: 1_000 });
  });

  it('locks when attempts reach maxAttempts', () => {
    let state = nextStateAfterAttempt(undefined, 1_000, policy);
    state = nextStateAfterAttempt(state, 2_000, policy);
    state = nextStateAfterAttempt(state, 3_000, policy);
    expect(state).toEqual({
      attempts: 3,
      firstAttemptAt: 1_000,
      lockedUntil: 3_000 + policy.durationMs,
    });
  });

  it('resets streak when window expired', () => {
    const stale = nextStateAfterAttempt(undefined, 1_000, policy);
    const staleSecond = nextStateAfterAttempt(stale, 2_000, policy);
    const afterWindow = nextStateAfterAttempt(
      staleSecond,
      1_000 + policy.windowMs + 1,
      policy,
    );
    expect(afterWindow).toEqual({
      attempts: 1,
      firstAttemptAt: 1_000 + policy.windowMs + 1,
    });
  });

  it('starts fresh streak after lockout expires', () => {
    const locked = {
      attempts: 3,
      firstAttemptAt: 1_000,
      lockedUntil: 10_000,
    };
    const afterLock = nextStateAfterAttempt(locked, 10_000, policy);
    expect(afterLock).toEqual({ attempts: 1, firstAttemptAt: 10_000 });
  });
});
