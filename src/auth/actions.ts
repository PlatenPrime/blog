'use server'

import config from '@payload-config'
import { login as payloadLogin, logout as payloadLogout } from '@payloadcms/next/auth'
import { getTranslations } from 'next-intl/server'
import { getPayload } from 'payload'

import { takeRateLimit } from './rateLimit'

export type AuthActionResult = { ok: true; message?: string } | { ok: false; error: string }

function readString(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

/** Payload's own text, used only to classify a known case. Never shown to the reader. */
function payloadErrorText(error: unknown): string {
  return error instanceof Error && error.message ? error.message : ''
}

async function chrome() {
  const auth = await getTranslations('auth')
  const errors = await getTranslations('errors')
  return { auth, errors }
}

export async function registerAction(formData: FormData): Promise<AuthActionResult> {
  const email = readString(formData, 'email').toLowerCase()
  const password = readString(formData, 'password')
  const { auth, errors } = await chrome()

  if (!email || !password) {
    return { ok: false, error: errors('emailAndPasswordRequired') }
  }

  if (password.length < 8) {
    return { ok: false, error: errors('passwordTooShort') }
  }

  const limit = takeRateLimit(`register:${email}`, { limit: 5, windowMs: 60_000 })
  if (!limit.allowed) {
    return { ok: false, error: errors('tooManyRegistrations') }
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
      message: auth('register.success'),
    }
  } catch {
    return { ok: false, error: errors('registrationFailed') }
  }
}

export async function loginAction(formData: FormData): Promise<AuthActionResult> {
  const email = readString(formData, 'email').toLowerCase()
  const password = readString(formData, 'password')
  const { errors } = await chrome()

  if (!email || !password) {
    return { ok: false, error: errors('emailAndPasswordRequired') }
  }

  const limit = takeRateLimit(`login:${email}`, { limit: 10, windowMs: 60_000 })
  if (!limit.allowed) {
    return { ok: false, error: errors('tooManyLogins') }
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
    if (/verif/i.test(payloadErrorText(error))) {
      return { ok: false, error: errors('verifyEmailFirst') }
    }
    return { ok: false, error: errors('invalidCredentials') }
  }
}

export async function logoutAction(): Promise<void> {
  await payloadLogout({ config })
}

export async function logoutEverywhereAction(): Promise<AuthActionResult> {
  const { auth, errors } = await chrome()

  try {
    await payloadLogout({ config, allSessions: true })
    return { ok: true, message: auth('logoutEverywhereSuccess') }
  } catch {
    return { ok: false, error: errors('logoutFailed') }
  }
}

export async function forgotPasswordAction(formData: FormData): Promise<AuthActionResult> {
  const email = readString(formData, 'email').toLowerCase()
  const { auth, errors } = await chrome()

  if (!email) {
    return { ok: false, error: errors('emailRequired') }
  }

  const limit = takeRateLimit(`forgot:${email}`, { limit: 3, windowMs: 15 * 60_000 })
  if (!limit.allowed) {
    return { ok: false, error: errors('tooManyResets') }
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
    message: auth('forgot.success'),
  }
}

export async function resetPasswordAction(formData: FormData): Promise<AuthActionResult> {
  const token = readString(formData, 'token')
  const password = readString(formData, 'password')
  const { auth, errors } = await chrome()

  if (!token || !password) {
    return { ok: false, error: errors('tokenAndPasswordRequired') }
  }

  if (password.length < 8) {
    return { ok: false, error: errors('passwordTooShort') }
  }

  try {
    const payload = await getPayload({ config })
    await payload.resetPassword({
      collection: 'users',
      data: { password, token },
      overrideAccess: true,
    })
    return { ok: true, message: auth('reset.success') }
  } catch {
    return { ok: false, error: errors('resetFailed') }
  }
}

export async function verifyEmailAction(token: string): Promise<AuthActionResult> {
  const trimmed = token.trim()
  const { auth, errors } = await chrome()

  if (!trimmed) {
    return { ok: false, error: errors('missingVerificationToken') }
  }

  try {
    const payload = await getPayload({ config })
    await payload.verifyEmail({
      collection: 'users',
      token: trimmed,
    })
    return { ok: true, message: auth('verify.success') }
  } catch {
    return {
      ok: false,
      error: errors('verificationFailed'),
    }
  }
}
