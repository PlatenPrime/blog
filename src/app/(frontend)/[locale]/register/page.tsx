import { registerAction } from '@/auth/actions'
import { Link } from '@/i18n/navigation'

import { AuthForm } from '../components/AuthForm'

export default function RegisterPage() {
  return (
    <div className="auth-page">
      <AuthForm
        action={registerAction}
        footer={
          <p>
            Already have an account? <Link href="/login">Log in</Link>
          </p>
        }
        submitLabel="Create account"
        successFallback="Account created. Check your email to verify before logging in."
        title="Register"
      />
    </div>
  )
}
