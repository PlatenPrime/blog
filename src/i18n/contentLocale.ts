import { resolveAppLocale } from './resolveAppLocale'
import type { AppLocale } from './routing'

/**
 * Locale for Payload content queries. Same codes as public URL locales
 * (ADR-004 / ADR-005). Unknown / empty values resolve to the default locale (`uk`).
 */
export function resolveContentLocale(locale: string | null | undefined): AppLocale {
  return resolveAppLocale(locale)
}
