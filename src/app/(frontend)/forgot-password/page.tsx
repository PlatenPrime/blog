import Link from 'next/link'

import { forgotPasswordAction } from '@/auth/actions'
import { AuthForm } from '../components/AuthForm'

export default function ForgotPasswordPage() {
  return (
    <div className="auth-page">
      <AuthForm
        action={forgotPasswordAction}
        footer={
          <p>
            <Link href="/login">Back to login</Link>
          </p>
        }
        showPassword={false}
        submitLabel="Send reset link"
        successFallback="If an account exists for that email, a reset link has been sent."
        title="Forgot password"
      />
    </div>
  )
}
