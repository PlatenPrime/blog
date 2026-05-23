/** Security audit event types for auth mutations (step 089+). */
export const SecurityAuditEventType = {
  AuthRegisterSuccess: 'auth.register.success',
  AuthLoginSuccess: 'auth.login.success',
  AuthLoginFailure: 'auth.login.failure',
  AuthLoginBlockedUnverified: 'auth.login.blocked_unverified',
  AuthLogout: 'auth.logout',
  AuthRefreshSuccess: 'auth.refresh.success',
  AuthRefreshReuseDetected: 'auth.refresh.reuse_detected',
  AuthVerifyEmailSuccess: 'auth.verify_email.success',
  AuthPasswordResetRequested: 'auth.password_reset.requested',
  AuthPasswordResetCompleted: 'auth.password_reset.completed',
  AuthLockoutTriggered: 'auth.lockout.triggered',
} as const;

export type SecurityAuditEventType =
  (typeof SecurityAuditEventType)[keyof typeof SecurityAuditEventType];

export const AUTH_SECURITY_AUDIT_EVENT_TYPES: readonly SecurityAuditEventType[] =
  [
    SecurityAuditEventType.AuthRegisterSuccess,
    SecurityAuditEventType.AuthLoginSuccess,
    SecurityAuditEventType.AuthLoginFailure,
    SecurityAuditEventType.AuthLoginBlockedUnverified,
    SecurityAuditEventType.AuthLogout,
    SecurityAuditEventType.AuthRefreshSuccess,
    SecurityAuditEventType.AuthRefreshReuseDetected,
    SecurityAuditEventType.AuthVerifyEmailSuccess,
    SecurityAuditEventType.AuthPasswordResetRequested,
    SecurityAuditEventType.AuthPasswordResetCompleted,
    SecurityAuditEventType.AuthLockoutTriggered,
  ];
