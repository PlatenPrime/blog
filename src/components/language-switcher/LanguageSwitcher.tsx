'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'

import { Link, usePathname } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'

const LOCALE_LABEL_KEY = {
  uk: 'localeUk',
  ru: 'localeRu',
  en: 'localeEn',
} as const satisfies Record<AppLocale, 'localeUk' | 'localeRu' | 'localeEn'>

export function LanguageSwitcher() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.toString()
  const href = search ? `${pathname}?${search}` : pathname

  return (
    <nav className="language-switcher" aria-label={t('language')}>
      <ul className="language-switcher-list">
        {routing.locales.map((target) => {
          const label = t(LOCALE_LABEL_KEY[target])
          const isCurrent = target === locale

          return (
            <li key={target}>
              {isCurrent ? (
                <span className="language-switcher-current" aria-current="page">
                  {label}
                </span>
              ) : (
                <Link className="language-switcher-link" href={href} locale={target}>
                  {label}
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
