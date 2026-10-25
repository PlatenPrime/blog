import { defineRouting } from 'next-intl/routing'

/**
 * Public URL locales. Same codes and default as Payload `localization`
 * (ADR-004). Prefix is always present; the browser language does not pick it.
 */
export const routing = defineRouting({
  locales: ['uk', 'ru', 'en'],
  defaultLocale: 'uk',
  localePrefix: 'always',
  localeDetection: false,
})

export type AppLocale = (typeof routing.locales)[number]
