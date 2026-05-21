import { describe, expect, it } from 'vitest';
import { hashEmailVerificationToken } from './email-verification-token-hash';

describe('hashEmailVerificationToken', () => {
  it('returns deterministic SHA-256 hex for the same input', () => {
    const raw = 'opaque-email-verification-token';
    expect(hashEmailVerificationToken(raw)).toBe(
      hashEmailVerificationToken(raw),
    );
  });

  it('returns different hashes for different inputs', () => {
    const hashA = hashEmailVerificationToken('token-a');
    const hashB = hashEmailVerificationToken('token-b');
    expect(hashA).not.toBe(hashB);
  });

  it('returns 64-character hex digest', () => {
    expect(hashEmailVerificationToken('x')).toMatch(/^[a-f0-9]{64}$/);
  });
});
