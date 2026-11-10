import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

type Bucket = {
  count: number
  resetAt: number
}

export type RateLimitResult = {
  allowed: boolean
  retryAfterMs: number
}

const memoryBuckets = new Map<string, Bucket>()

let warnedMissingUpstash = false
const upstashLimiters = new Map<string, Ratelimit>()

function readUpstashEnv(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim() ?? ''
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ?? ''
  if (!url || !token) {
    return null
  }
  return { url, token }
}

/** True when REST credentials are present (production path). */
export function isUpstashRateLimitConfigured(): boolean {
  return readUpstashEnv() !== null
}

function warnMissingUpstashOnce(): void {
  if (warnedMissingUpstash || process.env.NODE_ENV !== 'production') {
    return
  }
  warnedMissingUpstash = true
  console.warn(
    '[rateLimit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN unset; using in-memory limits (per isolate).',
  )
}

function windowDuration(windowMs: number): `${number} ms` | `${number} s` | `${number} m` {
  if (windowMs % 60_000 === 0) {
    return `${windowMs / 60_000} m`
  }
  if (windowMs % 1000 === 0) {
    return `${windowMs / 1000} s`
  }
  return `${windowMs} ms`
}

function getUpstashLimiter(limit: number, windowMs: number): Ratelimit | null {
  const env = readUpstashEnv()
  if (!env) {
    return null
  }

  const cacheKey = `${limit}:${windowMs}`
  const cached = upstashLimiters.get(cacheKey)
  if (cached) {
    return cached
  }

  const limiter = new Ratelimit({
    redis: new Redis({ url: env.url, token: env.token }),
    limiter: Ratelimit.fixedWindow(limit, windowDuration(windowMs)),
    prefix: 'blog:rl',
  })
  upstashLimiters.set(cacheKey, limiter)
  return limiter
}

function takeMemoryRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now()
  const existing = memoryBuckets.get(key)

  if (!existing || existing.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterMs: 0 }
  }

  if (existing.count >= limit) {
    return { allowed: false, retryAfterMs: Math.max(0, existing.resetAt - now) }
  }

  existing.count += 1
  return { allowed: true, retryAfterMs: 0 }
}

/**
 * Consume one attempt for `key` under a fixed window.
 * Uses Upstash when env is set; otherwise process-local memory (ADR-006).
 */
export async function takeRateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
): Promise<RateLimitResult> {
  const limiter = getUpstashLimiter(opts.limit, opts.windowMs)
  if (!limiter) {
    warnMissingUpstashOnce()
    return takeMemoryRateLimit(key, opts)
  }

  const result = await limiter.limit(key)
  const retryAfterMs = result.success ? 0 : Math.max(0, result.reset - Date.now())
  return { allowed: result.success, retryAfterMs }
}

/** Test helper — clear memory buckets and Upstash limiter cache between cases. */
export function resetRateLimits(): void {
  memoryBuckets.clear()
  upstashLimiters.clear()
  warnedMissingUpstash = false
}
