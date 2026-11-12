import createMiddleware from 'next-intl/middleware'

import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

/**
 * Locale prefix for the public site (ADR-004).
 * Payload (`/api`, `/admin`) and draft-preview handlers (`/next/...`) stay
 * outside the prefix. `next` is that handler segment, not a locale.
 */
export default intlMiddleware

export const config = {
  matcher: '/((?!api|admin|next|_next|_vercel|.*\\..*).*)',
}
