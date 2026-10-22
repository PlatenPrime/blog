import { routing, type AppLocale } from './routing'

/**
 * Prefix a site-relative path with the default locale (`/uk/...`).
 * Used for email links, OAuth redirects, and admin preview when no request locale exists.
 */
export function withDefaultLocale(path: string): string {
  return withLocale(routing.defaultLocale, path)
}

/**
 * Prefix a site-relative path with an explicit locale.
 */
export function withLocale(locale: AppLocale, path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (normalized === '/') return `/${locale}`
  return `/${locale}${normalized}`
}

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === 'string' && (routing.locales as readonly string[]).includes(value)
}
