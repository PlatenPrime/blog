'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState, useTransition } from 'react'

import type { AuthActionResult } from '@/auth/actions'

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
            setMessage(result.message ?? successFallback ?? 'Done.')
          })
        }}
      >
        {token ? <input name="token" type="hidden" value={token} /> : null}
        {showEmail ? (
          <label htmlFor="email">
            Email
            <input autoComplete="email" id="email" name="email" required type="email" />
          </label>
        ) : null}
        {showPassword ? (
          <label htmlFor="password">
            Password
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
          {isPending ? 'Please wait…' : submitLabel}
        </button>
      </form>
      {footer ? <div className="auth-footer">{footer}</div> : null}
      <p className="auth-footer">
        <Link href="/">← Home</Link>
      </p>
    </div>
  )
}
