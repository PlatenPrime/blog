import { hasLocale } from 'next-intl'

import { routing, type AppLocale } from './routing'

/**
 * Locale for Payload content queries. Same codes as public URL locales
 * (ADR-004). Unknown / empty values resolve to the default locale (`uk`).
 */
export function resolveContentLocale(locale: string | null | undefined): AppLocale {
  if (locale && hasLocale(routing.locales, locale)) return locale
  return routing.defaultLocale
}
