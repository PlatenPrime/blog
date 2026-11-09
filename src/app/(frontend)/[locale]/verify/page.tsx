import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

import { verifyEmailAction } from '@/auth/actions'
import { authPageMetadata } from '@/content/authPageMetadata'
import { Link } from '@/i18n/navigation'

type VerifyPageProps = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ token?: string }>
}

export async function generateMetadata({ params }: VerifyPageProps): Promise<Metadata> {
  const { locale } = await params
  return authPageMetadata({ locale, pathname: '/verify', titleKey: 'verify.title' })
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
