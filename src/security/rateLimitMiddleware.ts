import {
  RATE_LIMIT_POLICIES,
  type RateLimitBucket,
  type RateLimitPolicy,
} from './rateLimitPolicies'

const AUTH_PATH = /^(?:\/(?:uk|ru|en))\/(login|register|forgot-password|reset-password)\/?$/i

const AUTH_SEGMENT_TO_BUCKET = {
  login: 'login',
  register: 'register',
  'forgot-password': 'forgot',
  'reset-password': 'reset',
} as const satisfies Record<string, RateLimitBucket>

export type MiddlewareRateLimitTarget = {
  bucket: RateLimitBucket
  policy: RateLimitPolicy
  /** Redis / memory key prefix for this IP bucket. */
  keyPrefix: string
}

/**
 * Classify a request for proxy IP rate limiting.
 * Auth pages only: any POST. Comment spam is limited in the server action by userId
 * so article/note Next-Action POSTs (bookmarks, etc.) are not coupled to the comment bucket.
 */
export function resolveMiddlewareRateLimit(
  method: string,
  pathname: string,
  _headers: Headers,
): MiddlewareRateLimitTarget | null {
  if (method.toUpperCase() !== 'POST') {
    return null
  }

  const authMatch = AUTH_PATH.exec(pathname)
  if (!authMatch) {
    return null
  }

  const segment = authMatch[1]!.toLowerCase() as keyof typeof AUTH_SEGMENT_TO_BUCKET
  const bucket = AUTH_SEGMENT_TO_BUCKET[segment]
  if (!bucket) {
    return null
  }

  return {
    bucket,
    policy: RATE_LIMIT_POLICIES[bucket],
    keyPrefix: `mw:${bucket}`,
  }
}

/** Client IP for rate keys (first X-Forwarded-For hop, else X-Real-IP). */
export function clientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) {
      return first
    }
  }

  const realIp = headers.get('x-real-ip')?.trim()
  if (realIp) {
    return realIp
  }

  return 'unknown'
}
