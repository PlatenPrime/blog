import { getTranslations } from 'next-intl/server'

import { registerAction } from '@/auth/actions'
import { Link } from '@/i18n/navigation'

import { AuthForm } from '../components/AuthForm'

export default async function RegisterPage() {
  const tAuth = await getTranslations('auth')
  const tNav = await getTranslations('nav')

  return (
    <div className="auth-page">
      <AuthForm
        action={registerAction}
        footer={
          <p>
            {tAuth('register.hasAccount')} <Link href="/login">{tNav('login')}</Link>
          </p>
        }
        submitLabel={tAuth('register.submit')}
        successFallback={tAuth('register.success')}
        title={tAuth('register.title')}
      />
    </div>
  )
}
