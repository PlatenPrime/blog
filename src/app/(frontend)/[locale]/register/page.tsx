import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

import { registerAction } from '@/auth/actions'
import { authPageMetadata } from '@/content/authPageMetadata'
import { Link } from '@/i18n/navigation'

import { AuthForm } from '../components/AuthForm'

type RegisterPageProps = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: RegisterPageProps): Promise<Metadata> {
  const { locale } = await params
  return authPageMetadata({ locale, pathname: '/register', titleKey: 'register.title' })
}

export default async function RegisterPage() {
  const tAuth = await getTranslations('auth')
  const tNav = await getTranslations('nav')

  return (
    <div className="auth-page">
      <AuthForm
        action={registerAction}
        requireTurnstile
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
