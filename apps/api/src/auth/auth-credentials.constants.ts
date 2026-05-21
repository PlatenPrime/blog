/** Generic message for unknown email and wrong password (no account enumeration). */
export const INVALID_LOGIN_CREDENTIALS_MESSAGE =
  'Invalid email or password' as const;

/** Generic message for invalid, expired, revoked, or reused refresh tokens. */
export const INVALID_REFRESH_TOKEN_MESSAGE =
  'Invalid or expired refresh token' as const;
