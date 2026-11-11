/** Collision-resistant suffix for emails, slugs, and titles in parallel-ish suites. */
export function uniqueSuffix(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
