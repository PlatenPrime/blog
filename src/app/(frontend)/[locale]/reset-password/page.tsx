import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

import { resetPasswordAction } from '@/auth/actions'
import { authPageMetadata } from '@/content/authPageMetadata'
import { Link } from '@/i18n/navigation'

import { AuthForm } from '../components/AuthForm'

type ResetPasswordPageProps = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ token?: string }>
}

export async function generateMetadata({ params }: ResetPasswordPageProps): Promise<Metadata> {
  const { locale } = await params
  return authPageMetadata({ locale, pathname: '/reset-password', titleKey: 'reset.title' })
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams
  const tAuth = await getTranslations('auth')
  const tErrors = await getTranslations('errors')

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>{tAuth('reset.title')}</h1>
          <p className="auth-error" role="alert">
            {tErrors.rich('missingResetToken', {
              link: (chunks) => <Link href="/forgot-password">{chunks}</Link>,
            })}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <AuthForm
        action={resetPasswordAction}
        footer={
          <p>
            <Link href="/login">{tAuth('backToLogin')}</Link>
          </p>
        }
        redirectOnSuccess="/login"
        showEmail={false}
        submitLabel={tAuth('reset.submit')}
        title={tAuth('reset.title')}
        token={token}
      />
    </div>
  )
}
