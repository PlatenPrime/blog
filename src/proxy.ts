import createMiddleware from 'next-intl/middleware'

import { routing } from './i18n/routing'

/**
 * Next.js 16 proxy (formerly middleware): locale negotiation + always-prefix redirects.
 * Skips Payload `/admin`, `/api`, and draft-mode `/next/*` entrypoints.
 */
export default createMiddleware(routing)

export const config = {
  matcher: ['/', '/(uk|ru|en)/:path*', '/((?!api|admin|next|_next|_vercel|.*\\..*).*)'],
}
