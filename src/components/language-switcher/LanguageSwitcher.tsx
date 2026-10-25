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
    <nav aria-label={t('language')} className="font-sans text-small">
      <ul className="m-0 flex list-none gap-2 p-0">
        {routing.locales.map((target) => {
          const label = t(LOCALE_LABEL_KEY[target])
          const isCurrent = target === locale

          return (
            <li key={target}>
              {isCurrent ? (
                <span
                  aria-current="page"
                  className="inline-flex min-h-8 items-center font-semibold text-foreground"
                >
                  {label}
                </span>
              ) : (
                <Link
                  className="inline-flex min-h-8 items-center rounded-sm text-primary no-underline hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={href}
                  locale={target}
                >
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
