import NextLink from 'next/link'
import { getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'

import { siteChromeLinkClassName } from './site-nav'

type SiteAuthLinksProps = {
  isAdminUser: boolean
  isAuthenticated: boolean
}

export async function SiteAuthLinks({ isAdminUser, isAuthenticated }: SiteAuthLinksProps) {
  const t = await getTranslations('nav')
  const linkClassName = `${siteChromeLinkClassName} inline-flex min-h-8 items-center`

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {isAuthenticated ? (
        <Link className={linkClassName} href="/logout">
          {t('logout')}
        </Link>
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
