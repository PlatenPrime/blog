import { defineRouting } from 'next-intl/routing'

/**
 * Frontend URL locales — aligned with Payload `localization` (default `uk`).
 * Policy: ADR-004 (`localePrefix: 'always'`).
 */
export const routing = defineRouting({
  locales: ['uk', 'ru', 'en'],
  defaultLocale: 'uk',
  localePrefix: 'always',
})

export type AppLocale = (typeof routing.locales)[number]
