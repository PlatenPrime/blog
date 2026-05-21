/** Computes email verification token `expires_at` from wall-clock ms and TTL. */
export function emailVerificationExpiresAt(now: number, ttlMs: number): Date {
  return new Date(now + ttlMs);
}
