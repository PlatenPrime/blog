/**
 * HTTP security headers for Next.js `headers()` (step 073).
 * Pure builders — unit-tested; wired from `next.config.ts`.
 */

export type SecurityHeader = {
  key: string
  value: string
}

export type CspAudience = 'public' | 'admin'

export type BuildCspOptions = {
  audience: CspAudience
  /** Absolute public media origin, e.g. `https://media.example.com` (no trailing slash). */
  r2PublicOrigin?: string | null
  /** S3/R2 API origin for Payload client uploads (admin `connect-src`). */
  r2EndpointOrigin?: string | null
}

export type BuildBaselineHeadersOptions = {
  isProduction: boolean
}

export type BuildRouteSecurityHeadersOptions = BuildBaselineHeadersOptions & BuildCspOptions

const YOUTUBE_NOCOOKIE_ORIGIN = 'https://www.youtube-nocookie.com'

const PERMISSIONS_POLICY = [
  'camera=()',
  'microphone=()',
  'geolocation=()',
  'payment=()',
  'usb=()',
].join(', ')

/**
 * Parse `R2_PUBLIC_URL` (or any absolute URL) into an origin for CSP allowlists.
 * Returns null when missing or not an absolute http(s) URL.
 */
export function originFromPublicUrl(url: string | null | undefined): string | null {
  const trimmed = url?.trim()
  if (!trimmed) return null

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    return parsed.origin
  } catch {
    return null
  }
}

export function buildBaselineHeaders(options: BuildBaselineHeadersOptions): SecurityHeader[] {
  const headers: SecurityHeader[] = [
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: PERMISSIONS_POLICY },
  ]

  if (options.isProduction) {
    headers.push({
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload',
    })
  }

  return headers
}

/**
 * Phase-1 CSP: enforcing but pragmatic (inline theme/JSON-LD/Shiki; Payload needs eval on admin).
 * Tighten with nonces/hashes in a later pass — not this step.
 */
export function buildContentSecurityPolicy(options: BuildCspOptions): string {
  const imgSrc = ["'self'", 'data:', 'blob:']
  const r2Origin = options.r2PublicOrigin?.replace(/\/$/, '') || null
  if (r2Origin) imgSrc.push(r2Origin)

  const scriptSrc =
    options.audience === 'admin'
      ? ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
      : ["'self'", "'unsafe-inline'"]

  const styleSrc = ["'self'", "'unsafe-inline'"]

  const connectSrc = ["'self'"]
  if (options.audience === 'admin') {
    if (r2Origin) connectSrc.push(r2Origin)
    const endpointOrigin = options.r2EndpointOrigin?.replace(/\/$/, '') || null
    if (endpointOrigin && endpointOrigin !== r2Origin) connectSrc.push(endpointOrigin)
  }

  const frameSrc = YOUTUBE_NOCOOKIE_ORIGIN

  const directives: string[] = [
    `default-src 'self'`,
    `script-src ${scriptSrc.join(' ')}`,
    `style-src ${styleSrc.join(' ')}`,
    `img-src ${imgSrc.join(' ')}`,
    `font-src 'self'`,
    `connect-src ${connectSrc.join(' ')}`,
    `frame-src ${frameSrc}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
  ]

  return directives.join('; ')
}

/** Baseline hardening + Content-Security-Policy for one audience. */
export function buildRouteSecurityHeaders(
  options: BuildRouteSecurityHeadersOptions,
): SecurityHeader[] {
  return [
    ...buildBaselineHeaders({ isProduction: options.isProduction }),
    {
      key: 'Content-Security-Policy',
      value: buildContentSecurityPolicy({
        audience: options.audience,
        r2PublicOrigin: options.r2PublicOrigin,
        r2EndpointOrigin: options.r2EndpointOrigin,
      }),
    },
  ]
}
