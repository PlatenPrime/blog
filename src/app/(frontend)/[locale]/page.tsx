import { getTranslations } from 'next-intl/server'
import NextLink from 'next/link'
import React from 'react'

import { getCurrentUser } from '@/auth/getCurrentUser'
import { Link } from '@/i18n/navigation'

import { logoutEverywhereFormAction } from './actions/logoutEverywhere'

export default async function HomePage() {
  const user = await getCurrentUser()
  const t = await getTranslations('nav')

  return (
    <div className="home">
      <h1>{t('siteTitle')}</h1>
      <p>{t('siteDescription')}</p>
      {user ? (
        <div className="home-session" data-testid="session-user">
          <p>
            {t('signedInAs')} <strong data-testid="session-email">{user.email}</strong>
            {user._verified === false ? (
              <span className="auth-unverified"> {t('emailUnverified')}</span>
            ) : null}
          </p>
          <p>
            <Link href="/logout">{t('logout')}</Link>
          </p>
          <form action={logoutEverywhereFormAction}>
            <button type="submit">{t('logoutEverywhere')}</button>
          </form>
        </div>
      ) : (
        <p>
          <Link href="/login">{t('login')}</Link>
          {' · '}
          <Link href="/register">{t('register')}</Link>
        </p>
      )}
      <p>
        {/* Admin stays outside the locale prefix (ADR-004). */}
        <NextLink href="/admin">{t('openAdmin')}</NextLink>
      </p>
    </div>
  )
}
