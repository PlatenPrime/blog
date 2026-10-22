import React from 'react'

import { getCurrentUser } from '@/auth/getCurrentUser'
import { Link } from '@/i18n/navigation'

import { logoutEverywhereFormAction } from './actions/logoutEverywhere'
import './styles.css'

type HomePageProps = {
  params: Promise<{ locale: string }>
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params
  const user = await getCurrentUser()

  return (
    <div className="home">
      <h1>Blog</h1>
      <p>Personal blog — Next.js + Payload CMS.</p>
      <p data-testid="active-locale">Locale: {locale}</p>
      {user ? (
        <div className="home-session" data-testid="session-user">
          <p>
            Signed in as <strong data-testid="session-email">{user.email}</strong>
            {user._verified === false ? (
              <span className="auth-unverified"> (email not verified)</span>
            ) : null}
          </p>
          <p>
            <Link href="/logout">Log out</Link>
          </p>
          <form action={logoutEverywhereFormAction}>
            <button type="submit">Log out everywhere</button>
          </form>
        </div>
      ) : (
        <p>
          <Link href="/login">Log in</Link>
          {' · '}
          <Link href="/register">Register</Link>
        </p>
      )}
      <p>
        {/* Admin stays outside locale routing (ADR-004). */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- /admin is Payload, not a locale page */}
        <a href="/admin">Open admin</a>
      </p>
    </div>
  )
}
