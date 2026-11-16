import { unstable_cache } from 'next/cache'

/** Soft TTL so scheduled publish (ADR-003) can surface without a cron (ADR-009). */
export const CONTENT_CACHE_REVALIDATE_SECONDS = 60

/**
 * Cross-request cache for a public content loader.
 * Call with stable key parts only — never put a live `Date` / `now` in `keyParts`.
 */
export function withContentCache<TResult>(
  keyParts: string[],
  tags: string[],
  fn: () => Promise<TResult>,
): Promise<TResult> {
  return unstable_cache(fn, keyParts, {
    revalidate: CONTENT_CACHE_REVALIDATE_SECONDS,
    tags,
  })()
}
