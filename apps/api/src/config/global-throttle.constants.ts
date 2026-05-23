/** Default global HTTP throttle window (1 minute). */
export const DEFAULT_GLOBAL_THROTTLE_TTL_MS = 60_000;

/** Default max requests per IP per window across guarded routes. */
export const DEFAULT_GLOBAL_THROTTLE_LIMIT = 100;

/** Client-facing message when global throttle rejects a request. */
export const GLOBAL_THROTTLE_MESSAGE =
  'Too many requests. Try again later.' as const;
