import { resendAdapter } from '@payloadcms/email-resend'
import type { EmailAdapter } from 'payload'

/**
 * Resend when `RESEND_API_KEY` is set.
 * When unset, omit `email` from Payload config — Payload falls back to its built-in
 * console adapter (see payload email overview). Production should always set Resend.
 */
export function createEmailAdapter(): EmailAdapter | undefined {
  const apiKey = process.env.RESEND_API_KEY?.trim()

  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[email] RESEND_API_KEY is missing in production; Payload will log emails to console only.',
      )
    }
    return undefined
  }

  return resendAdapter({
    apiKey,
    defaultFromAddress: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
    defaultFromName: 'Blog',
  })
}
