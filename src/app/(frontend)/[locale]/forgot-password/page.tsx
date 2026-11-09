import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

import { forgotPasswordAction } from '@/auth/actions'
import { authPageMetadata } from '@/content/authPageMetadata'
import { Link } from '@/i18n/navigation'

import { AuthForm } from '../components/AuthForm'

type ForgotPasswordPageProps = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: ForgotPasswordPageProps): Promise<Metadata> {
  const { locale } = await params
  return authPageMetadata({ locale, pathname: '/forgot-password', titleKey: 'forgot.title' })
}

export default async function ForgotPasswordPage() {
  const tAuth = await getTranslations('auth')

  return (
    <div className="auth-page">
      <AuthForm
        action={forgotPasswordAction}
        footer={
          <p>
            <Link href="/login">{tAuth('backToLogin')}</Link>
          </p>
        }
        showPassword={false}
        submitLabel={tAuth('forgot.submit')}
        successFallback={tAuth('forgot.success')}
        title={tAuth('forgot.title')}
      />
    </div>
  )
}
