import { describe, expect, it } from 'vitest';
import { hashRefreshToken } from './refresh-token-hash';

describe('hashRefreshToken', () => {
  it('returns deterministic SHA-256 hex for the same input', () => {
    const raw = 'opaque-refresh-token-value';
    expect(hashRefreshToken(raw)).toBe(hashRefreshToken(raw));
  });

  it('returns different hashes for different inputs', () => {
    expect(hashRefreshToken('token-a')).not.toBe(hashRefreshToken('token-b'));
  });

  it('returns 64-character hex digest', () => {
    expect(hashRefreshToken('x')).toMatch(/^[a-f0-9]{64}$/);
  });
});
