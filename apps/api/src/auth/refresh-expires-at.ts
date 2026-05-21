/** Computes refresh token `expires_at` from wall-clock ms and configured TTL. */
export function refreshExpiresAt(now: number, ttlMs: number): Date {
  return new Date(now + ttlMs);
}
