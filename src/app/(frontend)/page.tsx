import Link from 'next/link'
import React from 'react'

import { getCurrentUser } from '@/auth/getCurrentUser'
import { logoutEverywhereFormAction } from './actions/logoutEverywhere'
import './styles.css'

export default async function HomePage() {
  const user = await getCurrentUser()

  return (
    <div className="home">
      <h1>Blog</h1>
      <p>Personal blog — Next.js + Payload CMS.</p>
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
        <Link href="/admin">Open admin</Link>
      </p>
    </div>
  )
}
