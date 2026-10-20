'use server'

import config from '@payload-config'
import { login as payloadLogin, logout as payloadLogout } from '@payloadcms/next/auth'
import { getPayload } from 'payload'

import { takeRateLimit } from './rateLimit'

export type AuthActionResult = { ok: true; message?: string } | { ok: false; error: string }

function readString(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export async function registerAction(formData: FormData): Promise<AuthActionResult> {
  const email = readString(formData, 'email').toLowerCase()
  const password = readString(formData, 'password')

  if (!email || !password) {
    return { ok: false, error: 'Email and password are required.' }
  }

  if (password.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters.' }
  }

  const limit = takeRateLimit(`register:${email}`, { limit: 5, windowMs: 60_000 })
  if (!limit.allowed) {
    return { ok: false, error: 'Too many registration attempts. Try again shortly.' }
  }

  try {
    const payload = await getPayload({ config })
    // Server action only accepts email/password from the client; role is forced here.
    // overrideAccess: true so we can set role despite field-level admin-only access.
    await payload.create({
      collection: 'users',
      data: {
        email,
        password,
        role: 'reader',
      },
      overrideAccess: true,
    })

    return {
      ok: true,
      message: 'Account created. Check your email to verify before logging in.',
    }
  } catch (error) {
    return { ok: false, error: errorMessage(error, 'Registration failed.') }
  }
}

export async function loginAction(formData: FormData): Promise<AuthActionResult> {
  const email = readString(formData, 'email').toLowerCase()
  const password = readString(formData, 'password')

  if (!email || !password) {
    return { ok: false, error: 'Email and password are required.' }
  }

  const limit = takeRateLimit(`login:${email}`, { limit: 10, windowMs: 60_000 })
  if (!limit.allowed) {
    return { ok: false, error: 'Too many login attempts. Try again shortly.' }
  }

  try {
    await payloadLogin({
      collection: 'users',
      config,
      email,
      password,
    })
    return { ok: true }
  } catch (error) {
    const message = errorMessage(error, 'Invalid email or password.')
    if (/verif/i.test(message)) {
      return { ok: false, error: 'Verify your email before logging in. Check your inbox.' }
    }
    return { ok: false, error: 'Invalid email or password.' }
  }
}

export async function logoutAction(): Promise<void> {
  await payloadLogout({ config })
}

export async function logoutEverywhereAction(): Promise<AuthActionResult> {
  try {
    await payloadLogout({ config, allSessions: true })
    return { ok: true, message: 'Signed out of all sessions.' }
  } catch (error) {
    return { ok: false, error: errorMessage(error, 'Logout failed.') }
  }
}

export async function forgotPasswordAction(formData: FormData): Promise<AuthActionResult> {
  const email = readString(formData, 'email').toLowerCase()

  if (!email) {
    return { ok: false, error: 'Email is required.' }
  }

  const limit = takeRateLimit(`forgot:${email}`, { limit: 3, windowMs: 15 * 60_000 })
  if (!limit.allowed) {
    return { ok: false, error: 'Too many reset requests. Try again later.' }
  }

  try {
    const payload = await getPayload({ config })
    await payload.forgotPassword({
      collection: 'users',
      data: { email },
      disableEmail: false,
    })
  } catch {
    // Do not reveal whether the email exists.
  }

  return {
    ok: true,
    message: 'If an account exists for that email, a reset link has been sent.',
  }
}

export async function resetPasswordAction(formData: FormData): Promise<AuthActionResult> {
  const token = readString(formData, 'token')
  const password = readString(formData, 'password')

  if (!token || !password) {
    return { ok: false, error: 'Token and new password are required.' }
  }

  if (password.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters.' }
  }

  try {
    const payload = await getPayload({ config })
    await payload.resetPassword({
      collection: 'users',
      data: { password, token },
      overrideAccess: true,
    })
    return { ok: true, message: 'Password updated. You can log in.' }
  } catch (error) {
    return { ok: false, error: errorMessage(error, 'Reset failed. The link may have expired.') }
  }
}

export async function verifyEmailAction(token: string): Promise<AuthActionResult> {
  const trimmed = token.trim()
  if (!trimmed) {
    return { ok: false, error: 'Missing verification token.' }
  }

  try {
    const payload = await getPayload({ config })
    await payload.verifyEmail({
      collection: 'users',
      token: trimmed,
    })
    return { ok: true, message: 'Email verified. You can log in.' }
  } catch (error) {
    return {
      ok: false,
      error: errorMessage(error, 'Verification failed. The link may have expired.'),
    }
  }
}
