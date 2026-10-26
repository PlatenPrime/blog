import type { Where } from 'payload'

import { publicContentWhere } from '@/access/publicContentWhere'
import { FEED_PAGE_SIZE } from '@/content/feedQuery'
import { latestPublicFindArgs, type LatestPublicCollection } from '@/content/latestPublicQuery'
import { numberedPageHref, readPageParam, type NumberedPageHref } from '@/content/numberedPage'
import { resolveContentLocale } from '@/i18n/contentLocale'
import type { AppLocale } from '@/i18n/routing'

/** Shelves on one index. A personal blog does not paginate this list. */
export const TAXONOMY_INDEX_LIMIT = 100

export type TaxonomyCollection = 'categories' | 'tags'

export type TaxonomyTerm = {
  id: number
  slug: string
  title: string
}

const taxonomyTermSelect = {
  id: true,
  slug: true,
  title: true,
} as const

/**
 * Every shelf in one collection.
 * No `user` and no `req`. Categories and tags have no drafts; read is public.
 */
export type TaxonomyIndexFindArgs = {
  collection: TaxonomyCollection
  depth: 0
  fallbackLocale: 'uk'
  limit: typeof TAXONOMY_INDEX_LIMIT
  locale: AppLocale
  overrideAccess: false
  pagination: false
  select: typeof taxonomyTermSelect
  sort: 'title'
}

/**
 * One shelf by its localized slug.
 * `fallbackLocale: 'uk'` matches articles and notes: an empty locale uses the base slug.
 */
export type TaxonomyTermFindArgs = {
  collection: TaxonomyCollection
  depth: 0
  fallbackLocale: 'uk'
  limit: 1
  locale: AppLocale
  overrideAccess: false
  pagination: false
  select: typeof taxonomyTermSelect
  where: Where
}

export type TaxonomyFeedCountArgs = {
  collection: LatestPublicCollection
  locale: AppLocale
  overrideAccess: false
  where: Where
}

export function taxonomyIndexFindArgs(args: {
  collection: TaxonomyCollection
  locale: string
}): TaxonomyIndexFindArgs {
  return {
    collection: args.collection,
    depth: 0,
    fallbackLocale: 'uk',
    limit: TAXONOMY_INDEX_LIMIT,
    locale: resolveContentLocale(args.locale),
    overrideAccess: false,
    pagination: false,
    select: taxonomyTermSelect,
    sort: 'title',
  }
}

export function taxonomyTermFindArgs(args: {
  collection: TaxonomyCollection
  locale: string
  slug: string
}): TaxonomyTermFindArgs {
  return {
    collection: args.collection,
    depth: 0,
    fallbackLocale: 'uk',
    limit: 1,
    locale: resolveContentLocale(args.locale),
    overrideAccess: false,
    pagination: false,
    select: taxonomyTermSelect,
    where: { slug: { equals: args.slug } },
  }
}

/**
 * Public visibility plus one taxonomy id.
 * `in` matches a hasMany relation that includes that id, on articles and on notes.
 * Drafts and a future date stay out through `publicContentWhere`.
 */
export function taxonomyContentWhere(args: {
  id: number
  now?: Date
  taxonomy: TaxonomyCollection
}): Where {
  return {
    and: [publicContentWhere(args.now), { [args.taxonomy]: { in: [args.id] } }],
  }
}

/**
 * Count arguments for one public collection inside a shelf.
 * No `user` and no `req`. `count` has no `draft` flag; `where` is the visibility rule.
 */
export function taxonomyFeedCountArgs(args: {
  collection: LatestPublicCollection
  id: number
  locale: string
  now?: Date
  taxonomy: TaxonomyCollection
}): TaxonomyFeedCountArgs {
  return {
    collection: args.collection,
    locale: resolveContentLocale(args.locale),
    overrideAccess: false,
    where: taxonomyContentWhere({ id: args.id, now: args.now, taxonomy: args.taxonomy }),
  }
}

/**
 * Find arguments for one page of a shelf.
 * Same window as the mixed feed (`page * FEED_PAGE_SIZE`); only `where` is narrower.
 * No `user` and no `req`: an admin session must not widen this to drafts.
 */
export function taxonomyFeedFindArgs(args: {
  collection: LatestPublicCollection
  id: number
  locale: string
  now?: Date
  page: number
  taxonomy: TaxonomyCollection
}) {
  return {
    ...latestPublicFindArgs({
      collection: args.collection,
      limit: args.page * FEED_PAGE_SIZE,
      locale: args.locale,
      now: args.now,
    }),
    where: taxonomyContentWhere({ id: args.id, now: args.now, taxonomy: args.taxonomy }),
  }
}

/** Canonical shelf path. Category detail is `/categories/[slug]`. Tag detail is `/tags/[slug]`. */
export function taxonomyTermPath(collection: TaxonomyCollection, slug: string): string {
  return `/${collection}/${slug}`
}

/** Page 1 has no query, so the first page of a shelf has one URL. */
export function taxonomyTermHref(
  collection: TaxonomyCollection,
  slug: string,
  page: number,
): NumberedPageHref<string> {
  return numberedPageHref(taxonomyTermPath(collection, slug), page)
}

/** First query value. A repeated `page` param does not become a second page. */
export function readTaxonomyPageParam(page: string | string[] | undefined): string | undefined {
  return readPageParam(page)
}

/** A row the index or the shelf heading can render. A blank title or slug is not a shelf. */
export function toTaxonomyTerm(
  doc:
    | {
        id?: number | null
        slug?: string | null
        title?: string | null
      }
    | null
    | undefined,
): TaxonomyTerm | null {
  if (!doc) return null
  if (typeof doc.id !== 'number') return null
  if (typeof doc.title !== 'string' || doc.title.length === 0) return null
  if (typeof doc.slug !== 'string' || doc.slug.length === 0) return null

  return { id: doc.id, slug: doc.slug, title: doc.title }
}
