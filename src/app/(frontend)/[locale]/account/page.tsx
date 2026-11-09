import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { isAuthenticatedAndVerified } from '@/access/isVerified'
import { getCurrentUser } from '@/auth/getCurrentUser'
import { siteChromeLinkClassName } from '@/components/site/site-nav'
import { buildPageMetadata, NOINDEX_ROBOTS } from '@/content/pageMetadata'
import { Link } from '@/i18n/navigation'
import { prefixPublicPath } from '@/i18n/paths'
import { resolveAppLocale } from '@/i18n/resolveAppLocale'
import { routing } from '@/i18n/routing'

import { logoutEverywhereFormAction } from '../actions/logoutEverywhere'

type AccountPageProps = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: AccountPageProps): Promise<Metadata> {
  const { locale: requested } = await params
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale
  const account = await getTranslations({ locale, namespace: 'account' })

  return buildPageMetadata({
    locale,
    pathname: '/account',
    robots: NOINDEX_ROBOTS,
    title: account('title'),
  })
}

export default async function AccountPage({ params }: AccountPageProps) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  setRequestLocale(locale)
  const [t, nav, user] = await Promise.all([
    getTranslations('account'),
    getTranslations('nav'),
    getCurrentUser(),
  ])
  const linkClassName = siteChromeLinkClassName
  const logoutHref = prefixPublicPath('/logout', resolveAppLocale(locale))
  const verified = isAuthenticatedAndVerified(user)

  return (
    <div className="bg-background font-serif text-foreground">
      <div className="mx-auto w-full max-w-measure px-5 pt-16 pb-24 sm:px-6 sm:pt-24">
        <h1 className="m-0 font-serif text-h1 text-foreground">{t('title')}</h1>
        {!user ? (
          <p className="mt-8 mb-0 text-body text-foreground">
            {t('loginPrompt')}{' '}
            <Link className={linkClassName} href="/login">
              {t('login')}
            </Link>
            <span aria-hidden="true"> · </span>
            <Link className={linkClassName} href="/register">
              {t('register')}
            </Link>
          </p>
        ) : (
          <div className="mt-8 space-y-6">
            <p className="m-0 text-body text-foreground">
              <span className="font-sans text-small text-muted-foreground">{t('emailLabel')}</span>
              <br />
              <span className="break-all">{user.email}</span>
              {verified ? null : (
                <>
                  {' '}
                  <span className="font-sans text-small text-muted-foreground">
                    {nav('emailUnverified')}
                  </span>
                </>
              )}
            </p>
            <ul className="m-0 list-none space-y-3 p-0 font-sans text-body">
              <li>
                <Link className={linkClassName} href="/forgot-password">
                  {t('resetPassword')}
                </Link>
              </li>
              <li>
                {/* Route handler, not a page: a client Link fetches an RSC payload and never hits GET. */}
                <a className={linkClassName} href={logoutHref}>
                  {t('logout')}
                </a>
              </li>
              <li>
                <form action={logoutEverywhereFormAction}>
                  <button
                    className={`${linkClassName} cursor-pointer border-0 bg-transparent p-0`}
                    type="submit"
                  >
                    {t('logoutEverywhere')}
                  </button>
                </form>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
