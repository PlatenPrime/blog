import { publicContentWhere } from '@/access/publicContentWhere'
import {
  latestPublicFindArgs,
  type LatestPublicCollection,
  type LatestPublicDoc,
  type LatestPublicFindArgs,
} from '@/content/latestPublicQuery'
import { resolveContentLocale } from '@/i18n/contentLocale'
import type { AppLocale } from '@/i18n/routing'

/** Titles per feed page. The find window is this many times the page number. */
export const FEED_PAGE_SIZE = 10

const pagePattern = /^[1-9]\d*$/

export type FeedItem = LatestPublicDoc & {
  collection: LatestPublicCollection
}

export type FeedCountArgs = {
  collection: LatestPublicCollection
  locale: AppLocale
  overrideAccess: false
  where: ReturnType<typeof publicContentWhere>
}

export type FeedPageHref = '/feed' | { pathname: '/feed'; query: { page: string } }

export type FeedPageResolution =
  { kind: 'redirect'; page: number | null } | { kind: 'render'; page: number }

/**
 * Count arguments for one public collection.
 * No `user` and no `req`. `count` has no `draft` flag; `where` is the same
 * visibility rule the find uses, so a draft or a future date is not a row.
 */
export function feedCountArgs(args: {
  collection: LatestPublicCollection
  locale: string
  now?: Date
}): FeedCountArgs {
  return {
    collection: args.collection,
    locale: resolveContentLocale(args.locale),
    overrideAccess: false,
    where: publicContentWhere(args.now),
  }
}

/**
 * Find arguments for one page of the mixed feed.
 * `limit` is `page * FEED_PAGE_SIZE`: the global top of that window is a subset
 * of the top of each collection, so the merge does not need a SQL union.
 */
export function feedFindArgs(args: {
  collection: LatestPublicCollection
  locale: string
  now?: Date
  page: number
}): LatestPublicFindArgs {
  return latestPublicFindArgs({
    collection: args.collection,
    limit: args.page * FEED_PAGE_SIZE,
    locale: args.locale,
    now: args.now,
  })
}

export function feedPageCount(total: number): number {
  if (total <= 0) return 0
  return Math.ceil(total / FEED_PAGE_SIZE)
}

/** First query value. A repeated `page` param does not become a second page. */
export function readFeedPageParam(page: string | string[] | undefined): string | undefined {
  if (Array.isArray(page)) return page[0]
  return page
}

/**
 * Which page to render, or where to send a bad query.
 * `page: null` is the canonical `/feed` (no query). `?page=1` redirects there.
 * A page past the end redirects to the last real page.
 */
export function resolveFeedPage(raw: string | undefined, total: number): FeedPageResolution {
  if (raw === undefined) return { kind: 'render', page: 1 }

  if (!pagePattern.test(raw)) return { kind: 'redirect', page: null }

  const requested = Number(raw)
  if (!Number.isSafeInteger(requested)) return { kind: 'redirect', page: null }
  if (requested === 1) return { kind: 'redirect', page: null }

  const pages = feedPageCount(total)
  if (pages === 0 || requested > pages) {
    return { kind: 'redirect', page: pages > 1 ? pages : null }
  }

  return { kind: 'render', page: requested }
}

/** Page 1 has no query, so the first page has one URL. */
export function feedPageHref(page: number): FeedPageHref {
  if (page <= 1) return '/feed'
  return { pathname: '/feed', query: { page: String(page) } }
}

/**
 * Missing and unparseable dates sort first, matching Postgres `DESC NULLS FIRST`.
 * Equal dates break by slug, then collection, so a page boundary does not move.
 */
function compareFeedItems(a: FeedItem, b: FeedItem): number {
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

export function mergePublicFeed(
  articles: readonly LatestPublicDoc[],
  notes: readonly LatestPublicDoc[],
  page: number,
): FeedItem[] {
  const items: FeedItem[] = [
    ...articles.map((doc) => ({ ...doc, collection: 'articles' as const })),
    ...notes.map((doc) => ({ ...doc, collection: 'notes' as const })),
  ]
  items.sort(compareFeedItems)

  const safePage = page < 1 ? 1 : page
  const start = (safePage - 1) * FEED_PAGE_SIZE
  return items.slice(start, start + FEED_PAGE_SIZE)
}
