export type RateLimitState = {
  readonly attempts: number;
  readonly firstAttemptAt: number;
  readonly lockedUntil?: number;
};

export type RateLimitPolicy = {
  readonly maxAttempts: number;
  readonly windowMs: number;
  readonly durationMs: number;
};

export function isRateLimited(
  state: RateLimitState | undefined,
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
  state: RateLimitState,
  now: number,
  windowMs: number,
): boolean {
  return now - state.firstAttemptAt > windowMs;
}

function isStreakActive(
  state: RateLimitState,
  now: number,
  windowMs: number,
): boolean {
  if (state.lockedUntil !== undefined) {
    return false;
  }

  return !isWindowExpired(state, now, windowMs);
}

export function nextStateAfterAttempt(
  state: RateLimitState | undefined,
  now: number,
  policy: RateLimitPolicy,
): RateLimitState {
  const active =
    state !== undefined && isStreakActive(state, now, policy.windowMs)
      ? state
      : undefined;

  const attempts = (active?.attempts ?? 0) + 1;
  const firstAttemptAt = active?.firstAttemptAt ?? now;

  if (attempts >= policy.maxAttempts) {
    return {
      attempts,
      firstAttemptAt,
      lockedUntil: now + policy.durationMs,
    };
  }

  return { attempts, firstAttemptAt };
}
