import { describe, expect, it } from 'vitest';
import type { RefreshToken } from './refresh-token.entity';
import { isRotatedReuse } from './refresh-token-reuse';

describe('isRotatedReuse', () => {
  it('returns true when token was revoked via rotation', () => {
    const row = {
      revokedAt: new Date('2026-05-20T12:00:00.000Z'),
      replacedByTokenId: 'rt-successor',
    } as RefreshToken;

    expect(isRotatedReuse(row)).toBe(true);
  });

  it('returns false when token was revoked via logout only', () => {
    const row = {
      revokedAt: new Date('2026-05-20T12:00:00.000Z'),
      replacedByTokenId: null,
    } as RefreshToken;

    expect(isRotatedReuse(row)).toBe(false);
  });

  it('returns false when token is still active', () => {
    const row = {
      revokedAt: null,
      replacedByTokenId: null,
    } as RefreshToken;

    expect(isRotatedReuse(row)).toBe(false);
  });
});
