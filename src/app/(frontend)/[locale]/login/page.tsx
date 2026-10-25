import { getTranslations } from 'next-intl/server'

import { loginAction } from '@/auth/actions'
import { Link } from '@/i18n/navigation'

import { AuthForm } from '../components/AuthForm'

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const oauthError = params.error
  const tAuth = await getTranslations('auth')
  const tErrors = await getTranslations('errors')
  const tNav = await getTranslations('nav')

  return (
    <div className="auth-page">
      {oauthError ? (
        <p className="auth-error auth-banner" role="alert">
          {tErrors('oauthFailed', { code: oauthError })}
        </p>
      ) : null}
      <AuthForm
        action={loginAction}
        footer={
          <>
            <p>
              {tAuth('login.noAccount')} <Link href="/register">{tNav('register')}</Link>
            </p>
            <p>
              <Link href="/forgot-password">{tAuth('login.forgot')}</Link>
            </p>
            {process.env.GOOGLE_CLIENT_ID ? (
              <p>
                {/* Native navigation required: OAuth authorize returns a redirect, not an RSC payload. */}
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- OAuth start must be a full document navigation */}
                <a href="/api/users/oauth/google">{tAuth('login.google')}</a>
              </p>
            ) : null}
          </>
        }
        redirectOnSuccess="/"
        submitLabel={tAuth('login.submit')}
        title={tAuth('login.title')}
      />
    </div>
  )
}
