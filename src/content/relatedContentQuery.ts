import type { Where } from 'payload'

import { publicContentWhere } from '@/access/publicContentWhere'
import type { FeedItem } from '@/content/feedQuery'
import {
  latestPublicFindArgs,
  type LatestPublicCollection,
  type LatestPublicDoc,
} from '@/content/latestPublicQuery'

/** How many related titles the reading page shows. Same budget as home latest. */
export const RELATED_LIMIT = 3

export type RelatedContentWhereArgs = {
  categoryIds: readonly number[]
  excludeId?: number
  now?: Date
  tagIds: readonly number[]
}

export type RelatedFindArgs = Omit<ReturnType<typeof latestPublicFindArgs>, 'where'> & {
  where: Where
}

/**
 * Public visibility, optional current-doc exclusion, and shared taxonomy.
 * Empty category and tag lists mean there is nothing to match: return null
 * so the caller skips the database.
 */
export function relatedContentWhere(args: RelatedContentWhereArgs): Where | null {
  const categoryIds = uniqueIds(args.categoryIds)
  const tagIds = uniqueIds(args.tagIds)
  if (categoryIds.length === 0 && tagIds.length === 0) return null

  const taxonomyClauses: Where[] = []
  if (categoryIds.length > 0) taxonomyClauses.push({ categories: { in: categoryIds } })
  if (tagIds.length > 0) taxonomyClauses.push({ tags: { in: tagIds } })

  const and: Where[] = [publicContentWhere(args.now)]
  if (typeof args.excludeId === 'number') {
    and.push({ id: { not_equals: args.excludeId } })
  }
  and.push(taxonomyClauses.length === 1 ? taxonomyClauses[0]! : { or: taxonomyClauses })

  return { and }
}

/**
 * Find arguments for one related collection.
 * `excludeId` applies only when this collection is the page the reader is on:
 * article and note ids live in separate tables and must not cancel each other.
 * No `user` and no `req`: an admin session must not widen this to drafts.
 */
export function relatedFindArgs(args: {
  categoryIds: readonly number[]
  collection: LatestPublicCollection
  excludeCollection: LatestPublicCollection
  excludeId: number
  locale: string
  now?: Date
  tagIds: readonly number[]
}): RelatedFindArgs | null {
  const where = relatedContentWhere({
    categoryIds: args.categoryIds,
    excludeId: args.collection === args.excludeCollection ? args.excludeId : undefined,
    now: args.now,
    tagIds: args.tagIds,
  })
  if (!where) return null

  return {
    ...latestPublicFindArgs({
      collection: args.collection,
      limit: RELATED_LIMIT,
      locale: args.locale,
      now: args.now,
    }),
    where,
  }
}

/**
 * Global top of the mixed related window.
 * Fetching `RELATED_LIMIT` from each collection is enough: the merged top N
 * is always a subset of the top N of each sorted list.
 */
export function mergeRelatedContent(
  articles: readonly LatestPublicDoc[],
  notes: readonly LatestPublicDoc[],
): FeedItem[] {
  const items: FeedItem[] = [
    ...articles.map((doc) => ({ ...doc, collection: 'articles' as const })),
    ...notes.map((doc) => ({ ...doc, collection: 'notes' as const })),
  ]
  items.sort(compareRelatedItems)
  return items.slice(0, RELATED_LIMIT)
}

/**
 * Missing and unparseable dates sort first, matching Postgres `DESC NULLS FIRST`
 * and the mixed feed.
 */
function compareRelatedItems(a: FeedItem, b: FeedItem): number {
  const byDate = comparePublishedAtDesc(a.publishedAt, b.publishedAt)
  if (byDate !== 0) return byDate
  if (a.slug !== b.slug) return a.slug < b.slug ? -1 : 1
  if (a.collection !== b.collection) return a.collection < b.collection ? -1 : 1
  return 0
}

function comparePublishedAtDesc(a: string | null, b: string | null): number {
  const aTime = publishedTime(a)
  const bTime = publishedTime(b)
  if (aTime === bTime) return 0
  if (aTime === null) return -1
  if (bTime === null) return 1
  return aTime > bTime ? -1 : 1
}

function publishedTime(iso: string | null): number | null {
  if (iso === null) return null
  const time = Date.parse(iso)
  return Number.isNaN(time) ? null : time
}

function uniqueIds(values: readonly number[]): number[] {
  const ids: number[] = []
  const seen = new Set<number>()
  for (const value of values) {
    if (!Number.isInteger(value) || seen.has(value)) continue
    seen.add(value)
    ids.push(value)
  }
  return ids
}
