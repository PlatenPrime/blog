import { getLocale, getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'
import { prefixPublicPath } from '@/i18n/paths'
import { resolveAppLocale } from '@/i18n/resolveAppLocale'

import { siteQuietLinkClassName } from './site-nav'
import { SiteNavLinks } from './site-nav-links'

export async function SiteFooter() {
  const t = await getTranslations('nav')
  const locale = resolveAppLocale(await getLocale())
  const rssHref = prefixPublicPath('/rss.xml', locale)

  return (
    <footer className="font-sans text-small text-muted-foreground">
      <div aria-hidden="true" className="site-chrome-edge" />
      <div className="mx-auto grid w-full max-w-shell gap-10 px-5 py-12 sm:px-6 md:grid-cols-[minmax(0,1.4fr)_auto_auto] md:items-start md:gap-16">
        <div className="max-w-sm">
          <p className="m-0 font-medium text-foreground">{t('siteTitle')}</p>
          <p className="mt-2 mb-0">{t('siteDescription')}</p>
        </div>
        <SiteNavLinks labelKey="footer" presentation="stack" />
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          <li>
            <Link className={siteQuietLinkClassName} href="/privacy">
              {t('privacy')}
            </Link>
          </li>
          <li>
            <Link className={siteQuietLinkClassName} href="/terms">
              {t('terms')}
            </Link>
          </li>
          {/* Route handler with a dotted path: client Link would miss GET. */}
          <li>
            <a className={siteQuietLinkClassName} href={rssHref}>
              {t('rss')}
            </a>
          </li>
        </ul>
      </div>
    </footer>
  )
}
