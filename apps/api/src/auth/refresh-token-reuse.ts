import type { RefreshToken } from './refresh-token.entity';

/** Token was rotated away (revoked with a successor), not logout-only revoke. */
export function isRotatedReuse(row: RefreshToken): boolean {
  return row.revokedAt !== null && row.replacedByTokenId !== null;
}
