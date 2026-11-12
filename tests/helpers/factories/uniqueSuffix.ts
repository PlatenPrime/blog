/** Collision-safe fragment for emails / slugs in hermetic tests. */
export function uniqueSuffix(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
