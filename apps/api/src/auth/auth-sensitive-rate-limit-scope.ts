export const AUTH_SENSITIVE_RATE_SCOPE_PASSWORD_RESET =
  'password-reset' as const;

export const AUTH_SENSITIVE_RATE_SCOPE_RESEND_VERIFICATION =
  'resend-verification' as const;

export type AuthSensitiveRateLimitScope =
  | typeof AUTH_SENSITIVE_RATE_SCOPE_PASSWORD_RESET
  | typeof AUTH_SENSITIVE_RATE_SCOPE_RESEND_VERIFICATION;
