import { describe, expect, it } from 'vitest';
import { normalizeUserEmail } from './normalize-user-email';

describe('normalizeUserEmail', () => {
  it('trims surrounding whitespace', () => {
    expect(normalizeUserEmail('  user@example.com  ')).toBe('user@example.com');
  });

  it('lowercases the address', () => {
    expect(normalizeUserEmail('User@Example.COM')).toBe('user@example.com');
  });

  it('is idempotent on already normalized input', () => {
    const normalized = 'user@example.com';
    expect(normalizeUserEmail(normalized)).toBe(normalized);
  });
});
