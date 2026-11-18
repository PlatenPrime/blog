import { getLocale, getTranslations } from 'next-intl/server'

import { SocialNetworkIcon } from '@/components/icons/social-icons'
import { Link } from '@/i18n/navigation'
import { prefixPublicPath } from '@/i18n/paths'
import { resolveAppLocale } from '@/i18n/resolveAppLocale'
import { socialProfiles } from '@/lib/socialProfiles'

import { siteQuietLinkClassName } from './site-nav'
import { SiteNavLinks } from './site-nav-links'

const socialIconLinkClassName =
  'inline-flex size-9 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

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
          <ul
            aria-label={t('social')}
            className="mt-5 mb-0 flex list-none flex-wrap items-center gap-1 p-0"
          >
            {socialProfiles.map((profile) => (
              <li key={profile.id}>
                <a
                  aria-label={t(profile.labelKey)}
                  className={socialIconLinkClassName}
                  href={profile.href}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <SocialNetworkIcon id={profile.id} />
                </a>
              </li>
            ))}
          </ul>
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
