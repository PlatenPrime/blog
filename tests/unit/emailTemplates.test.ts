/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  resetPasswordEmailHTML,
  resetPasswordEmailSubject,
  verificationEmailHTML,
  verificationEmailSubject,
} from '@/auth/emailTemplates'
import { getServerUrl } from '@/auth/serverUrl'
import { prefixPublicPath } from '@/i18n/paths'

function clearServerUrlEnv(): void {
  delete process.env.NEXT_PUBLIC_SERVER_URL
}

afterEach(() => {
  clearServerUrlEnv()
})

describe('getServerUrl', () => {
  it('defaults to localhost when env is empty', () => {
    clearServerUrlEnv()
    expect(getServerUrl()).toBe('http://localhost:3000')

    process.env.NEXT_PUBLIC_SERVER_URL = '   '
    expect(getServerUrl()).toBe('http://localhost:3000')
  })

  it('strips a trailing slash from the origin', () => {
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://blog.example.com/'
    expect(getServerUrl()).toBe('https://blog.example.com')
  })
})

describe('emailTemplates', () => {
  const token = 'abc/+?=&%token'

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://blog.example.com'
  })

  it('builds verify HTML with locale-prefixed path and encoded token', () => {
    const html = verificationEmailHTML(token)
    const expectedUrl = `${getServerUrl()}${prefixPublicPath('/verify')}?token=${encodeURIComponent(token)}`

    expect(html).toContain(expectedUrl)
    expect(html).toContain(`href="${expectedUrl}"`)
    expect(verificationEmailSubject()).toBe('Verify your Blog email')
  })

  it('builds reset HTML with locale-prefixed path and encoded token', () => {
    const html = resetPasswordEmailHTML(token)
    const expectedUrl = `${getServerUrl()}${prefixPublicPath('/reset-password')}?token=${encodeURIComponent(token)}`

    expect(html).toContain(expectedUrl)
    expect(html).toContain(`href="${expectedUrl}"`)
    expect(resetPasswordEmailSubject()).toBe('Reset your Blog password')
  })
})
