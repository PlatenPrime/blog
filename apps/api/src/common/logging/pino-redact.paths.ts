/** Placeholder written into redacted log fields (pino `redact.censor`). */
export const LOG_REDACT_CENSOR = '[Redacted]';

/**
 * Paths passed to pino `redact`. Covers app log objects and bindings that
 * `pino-http` may attach (`req.headers.*`) ahead of auth/CMS work in Track 2+.
 */
export const LOG_REDACT_PATHS = [
  'password',
  '*.password',
  'secret',
  '*.secret',
  'authorization',
  'cookie',
  'accessToken',
  '*.accessToken',
  'refreshToken',
  '*.refreshToken',
  'apiKey',
  '*.apiKey',
  'token',
  '*.token',
  'req.headers.authorization',
  'req.headers.cookie',
  'req.body.password',
  'req.body.secret',
  'req.body.token',
  'req.body.accessToken',
  'req.body.refreshToken',
] as const;
