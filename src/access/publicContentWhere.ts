import type { Where } from 'payload'

export type PublicVisibilityDoc = {
  _status?: ('draft' | 'published') | null
  publishedAt?: string | Date | null
}

/**
 * Public read constraint: published and not scheduled for the future (ADR-003).
 * Empty / null `publishedAt` counts as immediately visible.
 */
export function publicContentWhere(now: Date = new Date()): Where {
  const nowIso = now.toISOString()

  return {
    and: [
      { _status: { equals: 'published' } },
      {
        or: [
          { publishedAt: { exists: false } },
          { publishedAt: { equals: null } },
          { publishedAt: { less_than_equal: nowIso } },
        ],
      },
    ],
  }
}

/**
 * Pure visibility check for the same rules as `publicContentWhere` (unit-friendly).
 */
export function isPubliclyVisible(doc: PublicVisibilityDoc, now: Date = new Date()): boolean {
  if (doc._status !== 'published') return false

  if (doc.publishedAt == null || doc.publishedAt === '') return true

  const publishedAt = doc.publishedAt instanceof Date ? doc.publishedAt : new Date(doc.publishedAt)

  if (Number.isNaN(publishedAt.getTime())) return false

  return publishedAt.getTime() <= now.getTime()
}
