/** Computes password reset token `expires_at` from wall-clock ms and TTL. */
export function passwordResetExpiresAt(now: number, ttlMs: number): Date {
  return new Date(now + ttlMs);
}
