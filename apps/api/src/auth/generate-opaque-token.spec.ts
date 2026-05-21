import { describe, expect, it } from 'vitest';
import { generateOpaqueToken } from './generate-opaque-token';

describe('generateOpaqueToken', () => {
  it('returns a base64url string of expected length', () => {
    const token = generateOpaqueToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('returns distinct values on successive calls', () => {
    const a = generateOpaqueToken();
    const b = generateOpaqueToken();
    expect(a).not.toBe(b);
  });
});
