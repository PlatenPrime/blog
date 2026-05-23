import type { HelmetOptions } from 'helmet';

/**
 * API-friendly Helmet profile: JSON API without HTML; keep CORS clients working.
 * Production hardening (CSP, HSTS) — roadmap steps 294+.
 */
export function buildHelmetOptions(): HelmetOptions {
  return {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  };
}
