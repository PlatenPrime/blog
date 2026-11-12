import type { MetadataRoute } from 'next'
import type { Where } from 'payload'

import { publicContentWhere } from '@/access/publicContentWhere'
import { getServerUrl } from '@/lib/serverUrl'
import { ABOUT_PAGE_SLUG } from '@/content/pagesQuery'
import { TAXONOMY_INDEX_LIMIT, type TaxonomyCollection } from '@/content/taxonomyQuery'
import { resolveContentLocale } from '@/i18n/contentLocale'
import { prefixPublicPath } from '@/i18n/paths'
import { routing, type AppLocale } from '@/i18n/routing'

/** Personal blog size; one find per locale stays enough. */
export const SITEMAP_DOC_LIMIT = 1000

/**
 * Always-indexable public paths (no query string, page 1 only).
 * `/about` is separate: emit only when the CMS page is published.
 */
export const SITEMAP_STATIC_PATHS = [
  '/',
  '/feed',
  '/articles',
  '/notes',
  '/categories',
  '/tags',
  '/search',
] as const

export type SitemapStaticPath = (typeof SITEMAP_STATIC_PATHS)[number]

/** Paths that must never appear in the sitemap (auth, private, preview, admin). */
export const SITEMAP_EXCLUDED_PATH_FRAGMENTS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify',
  '/logout',
  '/account',
  '/bookmarks',
  '/dev/',
  '/admin',
  '/api/',
  '/next/',
] as const

export type SitemapContentCollection = 'articles' | 'notes'

export type SitemapSlugDoc = {
  id: number
  publishedAt?: string | null
  slug: string
}

const sitemapContentSelect = {
  id: true,
  publishedAt: true,
  slug: true,
} as const

const sitemapTaxonomySelect = {
  id: true,
  slug: true,
} as const

const sitemapAboutSelect = {
  id: true,
  slug: true,
} as const

export type SitemapContentFindArgs = {
  collection: SitemapContentCollection
  depth: 0
  draft: false
  fallbackLocale: 'uk'
  limit: typeof SITEMAP_DOC_LIMIT
  locale: AppLocale
  overrideAccess: false
  pagination: false
  select: typeof sitemapContentSelect
  sort: '-publishedAt'
  where: ReturnType<typeof publicContentWhere>
}

export type SitemapTaxonomyFindArgs = {
  collection: TaxonomyCollection
  depth: 0
  fallbackLocale: 'uk'
  limit: typeof TAXONOMY_INDEX_LIMIT
  locale: AppLocale
  overrideAccess: false
  pagination: false
  select: typeof sitemapTaxonomySelect
  sort: 'title'
}

export type SitemapAboutFindArgs = {
  collection: 'pages'
  depth: 0
  draft: false
  fallbackLocale: 'uk'
  limit: 1
  locale: AppLocale
  overrideAccess: false
  pagination: false
  select: typeof sitemapAboutSelect
  where: Where
}

/**
 * Published articles or notes for one locale.
 * No `user` and no `req`: an admin session must not widen this to drafts.
 */
export function sitemapContentFindArgs(args: {
  collection: SitemapContentCollection
  locale: string
  now?: Date
}): SitemapContentFindArgs {
  return {
    collection: args.collection,
    depth: 0,
    draft: false,
    fallbackLocale: 'uk',
    limit: SITEMAP_DOC_LIMIT,
    locale: resolveContentLocale(args.locale),
    overrideAccess: false,
    pagination: false,
    select: sitemapContentSelect,
    sort: '-publishedAt',
    where: publicContentWhere(args.now),
  }
}

/** Every category or tag shelf. Taxonomy has no drafts. */
export function sitemapTaxonomyFindArgs(args: {
  collection: TaxonomyCollection
  locale: string
}): SitemapTaxonomyFindArgs {
  return {
    collection: args.collection,
    depth: 0,
    fallbackLocale: 'uk',
    limit: TAXONOMY_INDEX_LIMIT,
    locale: resolveContentLocale(args.locale),
    overrideAccess: false,
    pagination: false,
    select: sitemapTaxonomySelect,
    sort: 'title',
  }
}

/**
 * Presence check for the author page. Same visibility as the public `/about` route.
 * Depth 0: body is irrelevant for the sitemap.
 */
export function sitemapAboutFindArgs(args: { locale?: string; now?: Date }): SitemapAboutFindArgs {
  return {
    collection: 'pages',
    depth: 0,
    draft: false,
    fallbackLocale: 'uk',
    limit: 1,
    locale: resolveContentLocale(args.locale ?? routing.defaultLocale),
    overrideAccess: false,
    pagination: false,
    select: sitemapAboutSelect,
    where: {
      and: [{ slug: { equals: ABOUT_PAGE_SLUG } }, publicContentWhere(args.now)],
    },
  }
}

export function sitemapOrigin(explicit?: string): string {
  return explicit ?? getServerUrl()
}

/** Absolute public URL with an explicit locale prefix. */
export function absolutePublicUrl(origin: string, pathname: string, locale: AppLocale): string {
  return `${origin.replace(/\/$/, '')}${prefixPublicPath(pathname, locale)}`
}

/**
 * hreflang map for one unprefixed path across all public locales.
 * `x-default` points at the default locale (uk), matching ADR-004.
 */
export function languageAlternatesForPath(
  origin: string,
  pathname: string,
): Record<string, string> {
  const languages: Record<string, string> = {}
  for (const locale of routing.locales) {
    languages[locale] = absolutePublicUrl(origin, pathname, locale)
  }
  languages['x-default'] = languages[routing.defaultLocale]
  return languages
}

export function toSitemapSlugDoc(doc: {
  id?: number | null
  publishedAt?: string | null
  slug?: string | null
}): SitemapSlugDoc | null {
  if (typeof doc.id !== 'number') return null
  if (typeof doc.slug !== 'string' || doc.slug.length === 0) return null

  const publishedAt =
    typeof doc.publishedAt === 'string' && doc.publishedAt.length > 0 ? doc.publishedAt : null

  return { id: doc.id, publishedAt, slug: doc.slug }
}

/**
 * Merge per-locale slug rows by document id so hreflang can point at localized slugs.
 */
export function mergeLocalizedSlugDocs(
  byLocale: Partial<Record<AppLocale, readonly SitemapSlugDoc[]>>,
): Map<number, Partial<Record<AppLocale, SitemapSlugDoc>>> {
  const byId = new Map<number, Partial<Record<AppLocale, SitemapSlugDoc>>>()

  for (const locale of routing.locales) {
    const docs = byLocale[locale]
    if (!docs) continue

    for (const doc of docs) {
      const locales = byId.get(doc.id) ?? {}
      locales[locale] = doc
      byId.set(doc.id, locales)
    }
  }

  return byId
}

export type SitemapBuildInput = {
  aboutPublished: boolean
  articlesByLocale: Partial<Record<AppLocale, readonly SitemapSlugDoc[]>>
  categoriesByLocale: Partial<Record<AppLocale, readonly SitemapSlugDoc[]>>
  notesByLocale: Partial<Record<AppLocale, readonly SitemapSlugDoc[]>>
  origin: string
  tagsByLocale: Partial<Record<AppLocale, readonly SitemapSlugDoc[]>>
}

/**
 * Full MetadataRoute.Sitemap payload: static shells, optional about, published docs, taxonomy.
 * Drafts never arrive here when find-args used `publicContentWhere`.
 */
export function buildSitemapEntries(input: SitemapBuildInput): MetadataRoute.Sitemap {
  const origin = input.origin.replace(/\/$/, '')
  const entries: MetadataRoute.Sitemap = []

  for (const pathname of SITEMAP_STATIC_PATHS) {
    entries.push(...entriesForSharedPath(origin, pathname))
  }

  if (input.aboutPublished) {
    entries.push(...entriesForSharedPath(origin, `/${ABOUT_PAGE_SLUG}`))
  }

  entries.push(
    ...entriesForLocalizedSegment(
      origin,
      'articles',
      mergeLocalizedSlugDocs(input.articlesByLocale),
    ),
  )
  entries.push(
    ...entriesForLocalizedSegment(origin, 'notes', mergeLocalizedSlugDocs(input.notesByLocale)),
  )
  entries.push(
    ...entriesForLocalizedSegment(
      origin,
      'categories',
      mergeLocalizedSlugDocs(input.categoriesByLocale),
    ),
  )
  entries.push(
    ...entriesForLocalizedSegment(origin, 'tags', mergeLocalizedSlugDocs(input.tagsByLocale)),
  )

  return entries
}

function entriesForSharedPath(origin: string, pathname: string): MetadataRoute.Sitemap {
  const languages = languageAlternatesForPath(origin, pathname)
  return routing.locales.map((locale) => ({
    url: languages[locale],
    alternates: { languages },
  }))
}

function entriesForLocalizedSegment(
  origin: string,
  segment: 'articles' | 'notes' | 'categories' | 'tags',
  byId: Map<number, Partial<Record<AppLocale, SitemapSlugDoc>>>,
): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  for (const locales of byId.values()) {
    const languages: Record<string, string> = {}

    for (const locale of routing.locales) {
      const doc = locales[locale]
      if (!doc) continue
      languages[locale] = absolutePublicUrl(origin, `/${segment}/${doc.slug}`, locale)
    }

    if (Object.keys(languages).length === 0) continue

    languages['x-default'] = languages[routing.defaultLocale] ?? Object.values(languages)[0] ?? ''

    const lastModified = latestPublishedAt(locales)

    for (const locale of routing.locales) {
      const doc = locales[locale]
      if (!doc) continue
      entries.push({
        url: languages[locale],
        ...(lastModified ? { lastModified } : {}),
        alternates: { languages },
      })
    }
  }

  return entries
}

function latestPublishedAt(locales: Partial<Record<AppLocale, SitemapSlugDoc>>): Date | undefined {
  let latest: Date | undefined

  for (const locale of routing.locales) {
    const raw = locales[locale]?.publishedAt
    if (!raw) continue
    const date = new Date(raw)
    if (Number.isNaN(date.getTime())) continue
    if (!latest || date.getTime() > latest.getTime()) latest = date
  }

  return latest
}
