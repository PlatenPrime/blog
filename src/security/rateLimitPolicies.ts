/**
 * Shared numeric policies for middleware IP limits and action identity limits (ADR-006).
 */

export type RateLimitPolicy = {
  limit: number
  windowMs: number
}

export const RATE_LIMIT_POLICIES = {
  register: { limit: 5, windowMs: 60_000 },
  login: { limit: 10, windowMs: 60_000 },
  forgot: { limit: 3, windowMs: 15 * 60_000 },
  reset: { limit: 5, windowMs: 15 * 60_000 },
  comments: { limit: 5, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitPolicy>

export type RateLimitBucket = keyof typeof RATE_LIMIT_POLICIES
