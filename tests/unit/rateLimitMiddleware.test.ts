/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import { RATE_LIMIT_POLICIES } from '@/security/rateLimitPolicies'
import { clientIpFromHeaders, resolveMiddlewareRateLimit } from '@/security/rateLimitMiddleware'

describe('resolveMiddlewareRateLimit', () => {
  it('limits POST to auth pages', () => {
    const login = resolveMiddlewareRateLimit('POST', '/uk/login', new Headers())
    expect(login).toEqual({
      bucket: 'login',
      policy: RATE_LIMIT_POLICIES.login,
      keyPrefix: 'mw:login',
    })

    const register = resolveMiddlewareRateLimit('POST', '/en/register/', new Headers())
    expect(register?.bucket).toBe('register')

    const forgot = resolveMiddlewareRateLimit('POST', '/ru/forgot-password', new Headers())
    expect(forgot?.bucket).toBe('forgot')

    const reset = resolveMiddlewareRateLimit('POST', '/uk/reset-password', new Headers())
    expect(reset).toEqual({
      bucket: 'reset',
      policy: RATE_LIMIT_POLICIES.reset,
      keyPrefix: 'mw:reset',
    })
  })

  it('ignores GET on auth pages', () => {
    expect(resolveMiddlewareRateLimit('GET', '/uk/login', new Headers())).toBeNull()
  })

  it('does not IP-limit article/note Next-Action POSTs (bookmarks share the page)', () => {
    const headers = new Headers({ 'next-action': 'abc123' })
    expect(resolveMiddlewareRateLimit('POST', '/uk/articles/hello', headers)).toBeNull()
    expect(resolveMiddlewareRateLimit('POST', '/en/notes/thought', headers)).toBeNull()
  })
})

describe('clientIpFromHeaders', () => {
  it('prefers the first X-Forwarded-For hop', () => {
    const headers = new Headers({
      'x-forwarded-for': '1.2.3.4, 5.6.7.8',
      'x-real-ip': '9.9.9.9',
    })
    expect(clientIpFromHeaders(headers)).toBe('1.2.3.4')
  })

  it('falls back to X-Real-IP then unknown', () => {
    expect(clientIpFromHeaders(new Headers({ 'x-real-ip': '9.9.9.9' }))).toBe('9.9.9.9')
    expect(clientIpFromHeaders(new Headers())).toBe('unknown')
  })
})
