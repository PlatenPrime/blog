import { hasLocale } from 'next-intl'

import { routing, type AppLocale } from './routing'

/**
 * Normalize a locale code to a known app locale.
 * Unknown / empty → default (`uk`). Used by request config and Payload queries (ADR-005).
 */
export function resolveAppLocale(locale: string | null | undefined): AppLocale {
  if (locale && hasLocale(routing.locales, locale)) return locale
  return routing.defaultLocale
}
