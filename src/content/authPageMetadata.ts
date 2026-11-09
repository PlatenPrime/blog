import { hasLocale } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

import { buildPageMetadata, NOINDEX_ROBOTS } from '@/content/pageMetadata'
import { routing, type AppLocale } from '@/i18n/routing'

type AuthTitleKey =
  'login.title' | 'register.title' | 'forgot.title' | 'reset.title' | 'verify.title'

/**
 * Unique noindex title + clean canonical for auth shells.
 * Shared so five routes do not re-state the same Metadata shape.
 */
export async function authPageMetadata(args: {
  locale: string
  pathname: `/${string}`
  titleKey: AuthTitleKey
}): Promise<Metadata> {
  const locale: AppLocale = hasLocale(routing.locales, args.locale)
    ? args.locale
    : routing.defaultLocale
  const auth = await getTranslations({ locale, namespace: 'auth' })

  return buildPageMetadata({
    locale,
    pathname: args.pathname,
    robots: NOINDEX_ROBOTS,
    title: auth(args.titleKey),
  })
}
