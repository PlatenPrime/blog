import { describe, expect, it } from 'vitest';
import { emailVerificationExpiresAt } from './email-verification-expires-at';

describe('emailVerificationExpiresAt', () => {
  it('adds ttlMs to now', () => {
    const now = 1_700_000_000_000;
    const ttlMs = 60_000;
    expect(emailVerificationExpiresAt(now, ttlMs)).toEqual(
      new Date(now + ttlMs),
    );
  });
});
