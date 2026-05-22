import { describe, expect, it } from 'vitest';
import {
  AUTH_SECURITY_AUDIT_EVENT_TYPES,
  SecurityAuditEventType,
} from './security-audit-event-type';

describe('SecurityAuditEventType', () => {
  it('exposes non-empty auth event type strings for step 089', () => {
    expect(SecurityAuditEventType.AuthLoginSuccess).toBe('auth.login.success');
    expect(SecurityAuditEventType.AuthRefreshReuseDetected).toBe(
      'auth.refresh.reuse_detected',
    );
    for (const value of AUTH_SECURITY_AUDIT_EVENT_TYPES) {
      expect(value.length).toBeGreaterThan(0);
      expect(value.length).toBeLessThanOrEqual(64);
    }
  });

  it('keeps auth event type values unique', () => {
    const unique = new Set(AUTH_SECURITY_AUDIT_EVENT_TYPES);
    expect(unique.size).toBe(AUTH_SECURITY_AUDIT_EVENT_TYPES.length);
  });
});
