import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const DEFAULT_DEV_ORIGIN = 'http://localhost:3000';
const WILDCARD_TOKEN = '*';
const CORS_METHODS = [
  'GET',
  'HEAD',
  'PUT',
  'PATCH',
  'POST',
  'DELETE',
  'OPTIONS',
] as const;

const parseOriginList = (raw: string): string[] =>
  raw
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

/**
 * Builds {@link CorsOptions} from environment variables.
 *
 * Sources `CORS_ORIGINS` as a comma-separated whitelist:
 * - missing / empty / whitespace → defaults to `http://localhost:3000` (dev web app).
 * - `*` (alone or alongside others) → reflects any origin (`origin: true`).
 * - otherwise → exact-match whitelist.
 *
 * `credentials` is intentionally `false` until Track 2 (Auth) introduces
 * cookie-based refresh tokens; at that point switch to `true` and forbid `*`.
 */
export function buildCorsOptions(env: NodeJS.ProcessEnv): CorsOptions {
  const raw = (env.CORS_ORIGINS ?? '').trim();
  const origins =
    raw.length === 0 ? [DEFAULT_DEV_ORIGIN] : parseOriginList(raw);
  const isWildcard = origins.includes(WILDCARD_TOKEN);

  return {
    origin: isWildcard ? true : origins,
    credentials: false,
    methods: [...CORS_METHODS],
  };
}
