import { getTranslations } from 'next-intl/server'

import { verifyEmailAction } from '@/auth/actions'
import { Link } from '@/i18n/navigation'

type VerifyPageProps = {
  searchParams: Promise<{ token?: string }>
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const { token } = await searchParams
  const tAuth = await getTranslations('auth')
  const tErrors = await getTranslations('errors')
  const tNav = await getTranslations('nav')

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>{tAuth('verify.title')}</h1>
          <p className="auth-error" role="alert">
            {tErrors('missingVerificationToken')}
          </p>
          <p className="auth-footer">
            <Link href="/login">{tNav('login')}</Link>
          </p>
        </div>
      </div>
    )
  }

  const result = await verifyEmailAction(token)

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>{tAuth('verify.title')}</h1>
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
          <Link href="/login">{tAuth('verify.goToLogin')}</Link>
        </p>
      </div>
    </div>
  )
}
