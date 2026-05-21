/** Generic message for unknown email and wrong password (no account enumeration). */
export const INVALID_LOGIN_CREDENTIALS_MESSAGE =
  'Invalid email or password' as const;

/** Generic message for invalid, expired, revoked, or reused refresh tokens. */
export const INVALID_REFRESH_TOKEN_MESSAGE =
  'Invalid or expired refresh token' as const;

/** Generic message for invalid, expired, or consumed email verification tokens. */
export const INVALID_EMAIL_VERIFICATION_TOKEN_MESSAGE =
  'Invalid or expired email verification token' as const;

/** Neutral message for password reset request (same whether email is registered or not). */
export const PASSWORD_RESET_REQUEST_ACCEPTED_MESSAGE =
  'If this email is registered, password reset instructions have been sent' as const;

/** Generic message for invalid, expired, or consumed password reset tokens. */
export const INVALID_PASSWORD_RESET_TOKEN_MESSAGE =
  'Invalid or expired password reset token' as const;

/** Success message after password reset completion. */
export const PASSWORD_RESET_COMPLETED_MESSAGE =
  'Password has been reset' as const;
