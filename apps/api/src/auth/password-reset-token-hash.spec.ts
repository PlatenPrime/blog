import { describe, expect, it } from 'vitest';
import { hashPasswordResetToken } from './password-reset-token-hash';

describe('hashPasswordResetToken', () => {
  it('returns deterministic SHA-256 hex for the same input', () => {
    const raw = 'opaque-password-reset-token';
    expect(hashPasswordResetToken(raw)).toBe(hashPasswordResetToken(raw));
  });

  it('returns different hashes for different inputs', () => {
    const hashA = hashPasswordResetToken('token-a');
    const hashB = hashPasswordResetToken('token-b');
    expect(hashA).not.toBe(hashB);
  });

  it('returns 64-character hex digest', () => {
    expect(hashPasswordResetToken('x')).toMatch(/^[a-f0-9]{64}$/);
  });
});
