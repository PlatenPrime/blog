'use client'

import { useEffect } from 'react'

type GlobalErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Same light-theme sample as the share card. App CSS and Manrope may be what
 * failed, so this screen keeps system sans and does not import `globals.css`.
 */
const bodyStyle = {
  background: '#eef6fd',
  color: '#1d2a37',
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  lineHeight: 1.5,
  margin: 0,
  minHeight: '100vh',
  padding: '4rem 1.25rem',
} as const

const linkStyle = {
  background: 'transparent',
  border: 0,
  color: '#19517b',
  cursor: 'pointer',
  font: 'inherit',
  padding: 0,
  textDecoration: 'underline',
} as const

/**
 * Last resort when a root layout throws. The locale catalog and app CSS
 * may be the thing that failed, so this screen does not import them.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="uk">
      <body style={bodyStyle}>
        <h1 style={{ fontSize: '2rem', fontWeight: 400, margin: 0 }}>
          Щось пішло не так. Something went wrong.
        </h1>
        <p style={{ marginTop: '1.5rem' }}>
          <button onClick={() => reset()} style={linkStyle} type="button">
            Спробувати ще раз
          </button>
          {' · '}
          {/* Full reload. Client `<Link>` needs a router that may be what failed. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/uk" style={linkStyle}>
            На головну
          </a>
        </p>
        {error.digest ? (
          <p style={{ fontSize: '0.875rem', marginTop: '1rem' }}>{error.digest}</p>
        ) : null}
      </body>
    </html>
  )
}
