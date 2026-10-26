import { publicContentWhere } from '@/access/publicContentWhere'
import { resolveContentLocale } from '@/i18n/contentLocale'
import type { AppLocale } from '@/i18n/routing'

/** How many titles of each kind the home page shows. The mixed feed paginates separately. */
export const LATEST_PUBLIC_LIMIT = 3

export type LatestPublicCollection = 'articles' | 'notes'

export type LatestPublicDoc = {
  publishedAt: string | null
  slug: string
  title: string
}

const latestPublicSelect = {
  publishedAt: true,
  slug: true,
  title: true,
} as const

/**
 * Local API arguments for the home lists.
 * No `user` and no `req`: an admin session must not widen this to drafts.
 * `where` repeats `publicContentWhere` so a forgotten `overrideAccess` still hides them.
 */
export type LatestPublicFindArgs = {
  collection: LatestPublicCollection
  depth: 0
  draft: false
  fallbackLocale: 'uk'
  limit: number
  locale: AppLocale
  overrideAccess: false
  pagination: false
  select: typeof latestPublicSelect
  sort: '-publishedAt'
  where: ReturnType<typeof publicContentWhere>
}

export function latestPublicFindArgs(args: {
  collection: LatestPublicCollection
  limit?: number
  locale: string
  now?: Date
}): LatestPublicFindArgs {
  return {
    collection: args.collection,
    depth: 0,
    draft: false,
    fallbackLocale: 'uk',
    limit: args.limit ?? LATEST_PUBLIC_LIMIT,
    locale: resolveContentLocale(args.locale),
    overrideAccess: false,
    pagination: false,
    select: latestPublicSelect,
    sort: '-publishedAt',
    where: publicContentWhere(args.now),
  }
}

/** Canonical public path. Detail routes arrive in steps 051 and 052. */
export function latestPublicPath(collection: LatestPublicCollection, slug: string): string {
  return `/${collection}/${slug}`
}

export function toLatestPublicDoc(doc: {
  publishedAt?: string | null
  slug?: string | null
  title?: string | null
}): LatestPublicDoc | null {
  if (typeof doc.title !== 'string' || doc.title.length === 0) return null
  if (typeof doc.slug !== 'string' || doc.slug.length === 0) return null

  const publishedAt =
    typeof doc.publishedAt === 'string' && doc.publishedAt.length > 0 ? doc.publishedAt : null

  return { publishedAt, slug: doc.slug, title: doc.title }
}
