/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import {
  buildBaselineHeaders,
  buildContentSecurityPolicy,
  buildRouteSecurityHeaders,
  originFromPublicUrl,
} from '@/security/headers'

describe('originFromPublicUrl', () => {
  it('returns origin for absolute http(s) URLs', () => {
    expect(originFromPublicUrl('https://media.example.com/bucket')).toBe(
      'https://media.example.com',
    )
    expect(originFromPublicUrl('http://localhost:9000/')).toBe('http://localhost:9000')
  })

  it('returns null for empty or invalid values', () => {
    expect(originFromPublicUrl(undefined)).toBeNull()
    expect(originFromPublicUrl('')).toBeNull()
    expect(originFromPublicUrl('  ')).toBeNull()
    expect(originFromPublicUrl('/api/media/file/x')).toBeNull()
    expect(originFromPublicUrl('not-a-url')).toBeNull()
  })
})

describe('buildBaselineHeaders', () => {
  it('always includes frame, nosniff, referrer, and permissions', () => {
    const keys = buildBaselineHeaders({ isProduction: false }).map((h) => h.key)
    expect(keys).toEqual([
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'Permissions-Policy',
    ])
  })

  it('adds HSTS only in production', () => {
    expect(
      buildBaselineHeaders({ isProduction: false }).some(
        (h) => h.key === 'Strict-Transport-Security',
      ),
    ).toBe(false)

    const prod = buildBaselineHeaders({ isProduction: true })
    const hsts = prod.find((h) => h.key === 'Strict-Transport-Security')
    expect(hsts?.value).toContain('max-age=63072000')
    expect(hsts?.value).toContain('includeSubDomains')
    expect(hsts?.value).toContain('preload')
  })

  it('sets DENY frame guard and strict-origin-when-cross-origin referrer', () => {
    const headers = buildBaselineHeaders({ isProduction: false })
    expect(headers.find((h) => h.key === 'X-Frame-Options')?.value).toBe('DENY')
    expect(headers.find((h) => h.key === 'Referrer-Policy')?.value).toBe(
      'strict-origin-when-cross-origin',
    )
    expect(headers.find((h) => h.key === 'X-Content-Type-Options')?.value).toBe('nosniff')
  })
})

describe('buildContentSecurityPolicy', () => {
  it('public CSP blocks framing and allows youtube-nocookie only', () => {
    const csp = buildContentSecurityPolicy({ audience: 'public' })
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain('frame-src https://www.youtube-nocookie.com')
    expect(csp).not.toContain('challenges.cloudflare.com')
    expect(csp).toContain("script-src 'self' 'unsafe-inline'")
    expect(csp).toContain("connect-src 'self'")
    expect(csp).not.toContain("'unsafe-eval'")
    expect(csp).toContain("object-src 'none'")
  })

  it('includes R2 public origin in img-src when set', () => {
    const csp = buildContentSecurityPolicy({
      audience: 'public',
      r2PublicOrigin: 'https://cdn.example.com',
    })
    expect(csp).toContain("img-src 'self' data: blob: https://cdn.example.com")
  })

  it('admin CSP allows unsafe-eval and R2 connect origins', () => {
    const csp = buildContentSecurityPolicy({
      audience: 'admin',
      r2PublicOrigin: 'https://cdn.example.com',
      r2EndpointOrigin: 'https://abc.r2.cloudflarestorage.com',
    })
    expect(csp).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'")
    expect(csp).toContain(
      "connect-src 'self' https://cdn.example.com https://abc.r2.cloudflarestorage.com",
    )
  })
})

describe('buildRouteSecurityHeaders', () => {
  it('merges baseline, optional HSTS, and CSP', () => {
    const headers = buildRouteSecurityHeaders({
      audience: 'public',
      isProduction: true,
    })
    expect(headers.map((h) => h.key)).toEqual([
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'Permissions-Policy',
      'Strict-Transport-Security',
      'Content-Security-Policy',
    ])
  })
})
