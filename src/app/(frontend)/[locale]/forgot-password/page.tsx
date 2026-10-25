import { getTranslations } from 'next-intl/server'

import { forgotPasswordAction } from '@/auth/actions'
import { Link } from '@/i18n/navigation'

import { AuthForm } from '../components/AuthForm'

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
