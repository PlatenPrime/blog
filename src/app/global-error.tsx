'use client'

import { useEffect } from 'react'

type GlobalErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

const bodyStyle = {
  background: '#f7f4ef',
  color: '#1a1a1a',
  fontFamily: 'Georgia, "Times New Roman", serif',
  lineHeight: 1.5,
  margin: 0,
  minHeight: '100vh',
  padding: '4rem 1.25rem',
} as const

const linkStyle = {
  background: 'transparent',
  border: 0,
  color: '#1a4d6d',
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
          <p style={{ fontFamily: 'sans-serif', fontSize: '0.875rem', marginTop: '1rem' }}>
            {error.digest}
          </p>
        ) : null}
      </body>
    </html>
  )
}
