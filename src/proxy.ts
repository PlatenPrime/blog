import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'

import { routing } from './i18n/routing'
import { takeRateLimit } from './security/rateLimit'
import { clientIpFromHeaders, resolveMiddlewareRateLimit } from './security/rateLimitMiddleware'

const intlMiddleware = createMiddleware(routing)

/**
 * Locale prefix for the public site (ADR-004) plus IP rate limits on sensitive POSTs (ADR-006).
 * Payload (`/api`, `/admin`) and draft-preview handlers (`/next/...`) stay
 * outside the prefix. `next` is that handler segment, not a locale.
 */
export default async function proxy(request: NextRequest) {
  const target = resolveMiddlewareRateLimit(
    request.method,
    request.nextUrl.pathname,
    request.headers,
  )

  if (target) {
    const ip = clientIpFromHeaders(request.headers)
    const result = await takeRateLimit(`${target.keyPrefix}:${ip}`, target.policy)
    if (!result.allowed) {
      const retryAfterSec = Math.max(1, Math.ceil(result.retryAfterMs / 1000))
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSec),
          'Content-Type': 'text/plain; charset=utf-8',
        },
      })
    }
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: '/((?!api|admin|next|_next|_vercel|.*\\..*).*)',
}
