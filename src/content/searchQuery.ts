import type { Where } from 'payload'

import { publicContentWhere } from '@/access/publicContentWhere'
import { FEED_PAGE_SIZE, mergePublicFeed, type FeedItem } from '@/content/feedQuery'
import { type LatestPublicCollection, type LatestPublicDoc } from '@/content/latestPublicQuery'
import {
  pageCount,
  readPageParam,
  resolveNumberedPage,
  type NumberedPageResolution,
} from '@/content/numberedPage'
import { resolveContentLocale } from '@/i18n/contentLocale'
import type { AppLocale } from '@/i18n/routing'

/** Same window as the mixed feed: dual find then in-memory merge. */
export const SEARCH_PAGE_SIZE = FEED_PAGE_SIZE

/** Cap pathological query strings before they hit ILIKE. */
export const SEARCH_QUERY_MAX_LENGTH = 100

export type SearchItem = FeedItem

export type SearchPageHref =
  | { pathname: '/search'; query: { q: string } }
  | { pathname: '/search'; query: { q: string; page: string } }

export type SearchPageResolution = NumberedPageResolution

const searchSelect = {
  publishedAt: true,
  slug: true,
  title: true,
} as const

/**
 * Trim, collapse whitespace, cap length. Empty / whitespace-only → null
 * (no DB round-trip; empty-query UX on the page).
 */
export function normalizeSearchQuery(raw: string | string[] | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (value === undefined) return null

  const normalized = value.trim().replace(/\s+/g, ' ')
  if (normalized.length === 0) return null

  return normalized.slice(0, SEARCH_QUERY_MAX_LENGTH)
}

/** First query value. A repeated `q` param does not become a second query. */
export function readSearchQueryParam(q: string | string[] | undefined): string | undefined {
  if (Array.isArray(q)) return q[0]
  return q
}

/** First page value. A repeated `page` param does not become a second page. */
export function readSearchPageParam(page: string | string[] | undefined): string | undefined {
  return readPageParam(page)
}

/**
 * Public visibility plus title / searchText ILIKE (`like`).
 * Call only with a normalized non-empty `q`.
 */
export function searchContentWhere(q: string, now: Date = new Date()): Where {
  return {
    and: [
      publicContentWhere(now),
      {
        or: [{ title: { like: q } }, { searchText: { like: q } }],
      },
    ],
  }
}

export type SearchCountArgs = {
  collection: LatestPublicCollection
  locale: AppLocale
  overrideAccess: false
  where: Where
}

export type SearchFindArgs = {
  collection: LatestPublicCollection
  depth: 0
  draft: false
  fallbackLocale: 'uk'
  limit: number
  locale: AppLocale
  overrideAccess: false
  pagination: false
  select: typeof searchSelect
  sort: '-publishedAt'
  where: Where
}

export function searchCountArgs(args: {
  collection: LatestPublicCollection
  locale: string
  now?: Date
  q: string
}): SearchCountArgs {
  return {
    collection: args.collection,
    locale: resolveContentLocale(args.locale),
    overrideAccess: false,
    where: searchContentWhere(args.q, args.now),
  }
}

/**
 * Find arguments for one page of mixed search hits.
 * `limit` is `page * SEARCH_PAGE_SIZE` (same dual-window trick as the feed).
 */
export function searchFindArgs(args: {
  collection: LatestPublicCollection
  locale: string
  now?: Date
  page: number
  q: string
}): SearchFindArgs {
  return {
    collection: args.collection,
    depth: 0,
    draft: false,
    fallbackLocale: 'uk',
    limit: args.page * SEARCH_PAGE_SIZE,
    locale: resolveContentLocale(args.locale),
    overrideAccess: false,
    pagination: false,
    select: searchSelect,
    sort: '-publishedAt',
    where: searchContentWhere(args.q, args.now),
  }
}

export function searchPageCount(total: number): number {
  return pageCount(total, SEARCH_PAGE_SIZE)
}

export function resolveSearchPage(raw: string | undefined, total: number): SearchPageResolution {
  return resolveNumberedPage(raw, total, SEARCH_PAGE_SIZE)
}

/** Always keep `q`. Page 1 omits `page` so the first page has one URL. */
export function searchPageHref(q: string, page: number): SearchPageHref {
  if (page <= 1) return { pathname: '/search', query: { q } }
  return { pathname: '/search', query: { q, page: String(page) } }
}

/** Canonical empty-query URL (no `q`, no `page`). */
export function searchEmptyHref(): '/search' {
  return '/search'
}

export function mergePublicSearch(
  articles: readonly LatestPublicDoc[],
  notes: readonly LatestPublicDoc[],
  page: number,
): SearchItem[] {
  return mergePublicFeed(articles, notes, page)
}
