/** Default sensitive-auth requests per email/IP within the window before lockout. */
export const DEFAULT_AUTH_SENSITIVE_RATE_MAX_ATTEMPTS = 3;

/** Default streak window for counting sensitive-auth requests (1 hour). */
export const DEFAULT_AUTH_SENSITIVE_RATE_WINDOW_MS = 3_600_000;

/** Default lockout duration after threshold (1 hour). */
export const DEFAULT_AUTH_SENSITIVE_RATE_DURATION_MS = 3_600_000;

export const AUTH_SENSITIVE_RATE_LIMIT_MESSAGE =
  'Too many requests. Please try again later.' as const;
