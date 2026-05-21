import { describe, expect, it } from 'vitest';
import { passwordResetExpiresAt } from './password-reset-expires-at';

describe('passwordResetExpiresAt', () => {
  it('adds ttlMs to now', () => {
    const now = 1_700_000_000_000;
    const ttlMs = 60_000;
    expect(passwordResetExpiresAt(now, ttlMs)).toEqual(new Date(now + ttlMs));
  });
});
