import Link from 'next/link'

import { resetPasswordAction } from '@/auth/actions'
import { AuthForm } from '../components/AuthForm'

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Reset password</h1>
          <p className="auth-error" role="alert">
            Missing reset token. Request a new link from{' '}
            <Link href="/forgot-password">Forgot password</Link>.
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
            <Link href="/login">Back to login</Link>
          </p>
        }
        redirectOnSuccess="/login"
        showEmail={false}
        submitLabel="Set new password"
        title="Reset password"
        token={token}
      />
    </div>
  )
}
