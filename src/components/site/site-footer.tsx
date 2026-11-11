import { getLocale, getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'
import { prefixPublicPath } from '@/i18n/paths'
import { resolveAppLocale } from '@/i18n/resolveAppLocale'

import { siteChromeLinkClassName } from './site-nav'
import { SiteNavLinks } from './site-nav-links'

export async function SiteFooter() {
  const t = await getTranslations('nav')
  const locale = resolveAppLocale(await getLocale())
  const rssHref = prefixPublicPath('/rss.xml', locale)

  return (
    <footer className="border-t border-border bg-background px-5 py-8 font-sans text-small text-muted-foreground">
      <div className="flex max-w-measure flex-col gap-4">
        <p className="m-0 font-medium text-foreground">{t('siteTitle')}</p>
        <p className="m-0">{t('siteDescription')}</p>
        <SiteNavLinks labelKey="footer" />
        <p className="m-0">
          <Link
            className={`${siteChromeLinkClassName} inline-flex min-h-8 items-center`}
            href="/privacy"
          >
            {t('privacy')}
          </Link>
        </p>
        {/* Route handler with a dotted path: client Link would miss GET. */}
        <p className="m-0">
          <a
            className={`${siteChromeLinkClassName} inline-flex min-h-8 items-center`}
            href={rssHref}
          >
            {t('rss')}
          </a>
        </p>
      </div>
    </footer>
  )
}
