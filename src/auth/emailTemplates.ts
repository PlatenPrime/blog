import { withDefaultLocale } from '@/i18n/paths'

import { getServerUrl } from './serverUrl'

export function verificationEmailHTML(token: string): string {
  const url = `${getServerUrl()}${withDefaultLocale('/verify')}?token=${encodeURIComponent(token)}`
  return `
    <!doctype html>
    <html>
      <body>
        <p>Confirm your email for Blog.</p>
        <p><a href="${url}">Verify email</a></p>
        <p>Or open: ${url}</p>
      </body>
    </html>
  `.trim()
}

export function verificationEmailSubject(): string {
  return 'Verify your Blog email'
}

export function resetPasswordEmailHTML(token: string): string {
  const url = `${getServerUrl()}${withDefaultLocale('/reset-password')}?token=${encodeURIComponent(token)}`
  return `
    <!doctype html>
    <html>
      <body>
        <p>Reset your Blog password.</p>
        <p><a href="${url}">Choose a new password</a></p>
        <p>Or open: ${url}</p>
        <p>If you did not request this, ignore this email.</p>
      </body>
    </html>
  `.trim()
}

export function resetPasswordEmailSubject(): string {
  return 'Reset your Blog password'
}
