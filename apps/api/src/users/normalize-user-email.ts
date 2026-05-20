/** Canonical email form for storage and lookup (trim + lowercase). */
export function normalizeUserEmail(email: string): string {
  return email.trim().toLowerCase();
}
