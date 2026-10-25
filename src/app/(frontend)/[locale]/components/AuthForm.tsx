'use client'

import { useTranslations } from 'next-intl'
import React, { useState, useTransition } from 'react'

import type { AuthActionResult } from '@/auth/actions'
import { Link, useRouter } from '@/i18n/navigation'

type AuthFormProps = {
  title: string
  submitLabel: string
  action: (formData: FormData) => Promise<AuthActionResult>
  /** When true, include email field. */
  showEmail?: boolean
  /** When true, include password field. */
  showPassword?: boolean
  /** Optional hidden token field (reset flow). */
  token?: string
  footer?: React.ReactNode
  redirectOnSuccess?: string
  successFallback?: string
}

export function AuthForm({
  title,
  submitLabel,
  action,
  showEmail = true,
  showPassword = true,
  token,
  footer,
  redirectOnSuccess,
  successFallback,
}: AuthFormProps) {
  const router = useRouter()
  const tAuth = useTranslations('auth')
  const tNav = useTranslations('nav')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <div className="auth-card">
      <h1>{title}</h1>
      <form
        className="auth-form"
        onSubmit={(event) => {
          event.preventDefault()
          setError(null)
          setMessage(null)
          const formData = new FormData(event.currentTarget)
          startTransition(async () => {
            const result = await action(formData)
            if (!result.ok) {
              setError(result.error)
              return
            }
            if (redirectOnSuccess) {
              router.push(redirectOnSuccess)
              router.refresh()
              return
            }
            setMessage(result.message ?? successFallback ?? tAuth('done'))
          })
        }}
      >
        {token ? <input name="token" type="hidden" value={token} /> : null}
        {showEmail ? (
          <label htmlFor="email">
            {tAuth('email')}
            <input autoComplete="email" id="email" name="email" required type="email" />
          </label>
        ) : null}
        {showPassword ? (
          <label htmlFor="password">
            {tAuth('password')}
            <input
              autoComplete={token ? 'new-password' : 'current-password'}
              id="password"
              minLength={8}
              name="password"
              required
              type="password"
            />
          </label>
        ) : null}
        {error ? (
          <p className="auth-error" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="auth-success" role="status">
            {message}
          </p>
        ) : null}
        <button disabled={isPending} type="submit">
          {isPending ? tAuth('pending') : submitLabel}
        </button>
      </form>
      {footer ? <div className="auth-footer">{footer}</div> : null}
      <p className="auth-footer">
        <Link href="/">← {tNav('home')}</Link>
      </p>
    </div>
  )
}
