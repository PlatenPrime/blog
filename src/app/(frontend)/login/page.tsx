import Link from 'next/link'

import { loginAction } from '@/auth/actions'
import { AuthForm } from '../components/AuthForm'

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const oauthError = params.error

  return (
    <div className="auth-page">
      {oauthError ? (
        <p className="auth-error auth-banner" role="alert">
          Google sign-in failed: {oauthError}
        </p>
      ) : null}
      <AuthForm
        action={loginAction}
        footer={
          <>
            <p>
              No account? <Link href="/register">Register</Link>
            </p>
            <p>
              <Link href="/forgot-password">Forgot password?</Link>
            </p>
            {process.env.GOOGLE_CLIENT_ID ? (
              <p>
                {/* Native navigation required: OAuth authorize returns a redirect, not an RSC payload. */}
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- OAuth start must be a full document navigation */}
                <a href="/api/users/oauth/google">Continue with Google</a>
              </p>
            ) : null}
          </>
        }
        redirectOnSuccess="/"
        submitLabel="Log in"
        title="Log in"
      />
    </div>
  )
}
