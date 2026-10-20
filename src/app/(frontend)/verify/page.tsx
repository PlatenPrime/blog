import Link from 'next/link'

import { verifyEmailAction } from '@/auth/actions'

type VerifyPageProps = {
  searchParams: Promise<{ token?: string }>
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const { token } = await searchParams

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Verify email</h1>
          <p className="auth-error" role="alert">
            Missing verification token.
          </p>
          <p className="auth-footer">
            <Link href="/login">Log in</Link>
          </p>
        </div>
      </div>
    )
  }

  const result = await verifyEmailAction(token)

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Verify email</h1>
        {result.ok ? (
          <p className="auth-success" role="status">
            {result.message}
          </p>
        ) : (
          <p className="auth-error" role="alert">
            {result.error}
          </p>
        )}
        <p className="auth-footer">
          <Link href="/login">Go to login</Link>
        </p>
      </div>
    </div>
  )
}
