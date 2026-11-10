/** @vitest-environment node */
import { afterEach, describe, expect, it } from 'vitest'

import { isUpstashRateLimitConfigured, resetRateLimits, takeRateLimit } from '@/security/rateLimit'

describe('takeRateLimit', () => {
  afterEach(() => {
    resetRateLimits()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('uses memory when Upstash env is unset', () => {
    expect(isUpstashRateLimitConfigured()).toBe(false)
  })

  it('allows requests under the limit', async () => {
    expect((await takeRateLimit('k', { limit: 2, windowMs: 60_000 })).allowed).toBe(true)
    expect((await takeRateLimit('k', { limit: 2, windowMs: 60_000 })).allowed).toBe(true)
  })

  it('blocks when the limit is exceeded', async () => {
    await takeRateLimit('k', { limit: 1, windowMs: 60_000 })
    const blocked = await takeRateLimit('k', { limit: 1, windowMs: 60_000 })
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfterMs).toBeGreaterThan(0)
  })

  it('isolates keys', async () => {
    await takeRateLimit('a', { limit: 1, windowMs: 60_000 })
    expect((await takeRateLimit('b', { limit: 1, windowMs: 60_000 })).allowed).toBe(true)
    expect((await takeRateLimit('a', { limit: 1, windowMs: 60_000 })).allowed).toBe(false)
  })
})
