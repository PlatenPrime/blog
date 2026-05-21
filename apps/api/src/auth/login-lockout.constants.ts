/** Default failed login attempts before lockout. */
export const DEFAULT_LOGIN_LOCKOUT_MAX_ATTEMPTS = 5;

/** Default streak window for counting failures (15 minutes). */
export const DEFAULT_LOGIN_LOCKOUT_WINDOW_MS = 900_000;

/** Default lockout duration after threshold (15 minutes). */
export const DEFAULT_LOGIN_LOCKOUT_DURATION_MS = 900_000;

/** Client-facing message when login is temporarily blocked. */
export const LOGIN_LOCKOUT_MESSAGE =
  'Too many login attempts. Try again later.' as const;
