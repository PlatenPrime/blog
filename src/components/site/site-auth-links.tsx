import NextLink from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'

import { prefixPublicPath } from '@/i18n/paths'
import { Link } from '@/i18n/navigation'
import { resolveAppLocale } from '@/i18n/resolveAppLocale'

import { siteChromeLinkClassName } from './site-nav'

type SiteAuthLinksProps = {
  isAdminUser: boolean
  isAuthenticated: boolean
}

export async function SiteAuthLinks({ isAdminUser, isAuthenticated }: SiteAuthLinksProps) {
  const t = await getTranslations('nav')
  const linkClassName = `${siteChromeLinkClassName} inline-flex min-h-8 items-center`
  const logoutHref = prefixPublicPath('/logout', resolveAppLocale(await getLocale()))

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {isAuthenticated ? (
        // Route handler, not a page: a client Link fetches an RSC payload and never hits GET.
        <a className={linkClassName} href={logoutHref}>
          {t('logout')}
        </a>
      ) : (
        <>
          <Link className={linkClassName} href="/login">
            {t('login')}
          </Link>
          <Link className={linkClassName} href="/register">
            {t('register')}
          </Link>
        </>
      )}
      {isAdminUser ? (
        <NextLink className={linkClassName} href="/admin">
          {t('openAdmin')}
        </NextLink>
      ) : null}
    </div>
  )
}
