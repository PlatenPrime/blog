/** @vitest-environment node */
import { afterEach, describe, expect, it } from 'vitest'

import { resetRateLimits, takeRateLimit } from '@/auth/rateLimit'

describe('takeRateLimit', () => {
  afterEach(() => {
    resetRateLimits()
  })

  it('allows requests under the limit', () => {
    expect(takeRateLimit('k', { limit: 2, windowMs: 60_000 }).allowed).toBe(true)
    expect(takeRateLimit('k', { limit: 2, windowMs: 60_000 }).allowed).toBe(true)
  })

  it('blocks when the limit is exceeded', () => {
    takeRateLimit('k', { limit: 1, windowMs: 60_000 })
    const blocked = takeRateLimit('k', { limit: 1, windowMs: 60_000 })
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfterMs).toBeGreaterThan(0)
  })
})
