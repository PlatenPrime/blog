import { describe, expect, it } from 'vitest';
import { refreshExpiresAt } from './refresh-expires-at';

describe('refreshExpiresAt', () => {
  it('adds ttlMs to now', () => {
    const now = 1_700_000_000_000;
    const ttlMs = 60_000;
    expect(refreshExpiresAt(now, ttlMs)).toEqual(new Date(now + ttlMs));
  });
});
