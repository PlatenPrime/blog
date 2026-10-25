import { hasLocale } from 'next-intl'

import { routing, type AppLocale } from './routing'

/**
 * Root-relative public path with an explicit locale prefix.
 * Emails and OAuth returns use this so the URL does not depend on a redirect
 * from an unprefixed path (which always lands on the default locale).
 */
export function prefixPublicPath(
  pathname: string,
  locale: AppLocale = routing.defaultLocale,
): string {
  if (!pathname.startsWith('/') || pathname.startsWith('//')) {
    throw new Error(`prefixPublicPath expects a root-relative pathname, received: ${pathname}`)
  }

  if (pathname === '/') return `/${locale}`
  return `/${locale}${pathname}`
}

/**
 * Locale segment of a pathname, or the default locale when the first segment
 * is missing or unknown.
 */
export function localeFromPathname(pathname: string): AppLocale {
  const segment = pathname.split('/').filter(Boolean)[0]
  if (segment && hasLocale(routing.locales, segment)) return segment
  return routing.defaultLocale
}
