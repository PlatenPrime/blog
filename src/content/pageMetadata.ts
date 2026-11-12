import type { Metadata } from 'next'
import type { Where } from 'payload'

import { publicContentWhere } from '@/access/publicContentWhere'
import { getServerUrl } from '@/lib/serverUrl'
import { absolutePublicUrl, languageAlternatesForPath } from '@/content/sitemapQuery'
import { resolveContentLocale } from '@/i18n/contentLocale'
import { routing, type AppLocale } from '@/i18n/routing'

/** Private shells and parameterized search must not compete in the index. */
export const NOINDEX_ROBOTS = { follow: false, index: false } as const

export type LocalizedSlugSegment = 'articles' | 'categories' | 'notes' | 'tags'

export type BuildPageMetadataArgs = {
  /** Absolute URL origin. Defaults to `getServerUrl()`. */
  origin?: string
  /** Unprefixed public path, never a query string. */
  pathname: string
  locale: AppLocale
  /** Page segment for `title.template`, or the full string when `absoluteTitle`. */
  title: string
  /** When true, bypasses the layout `%s — siteTitle` template. */
  absoluteTitle?: boolean
  description?: string
  /** Override hreflang map. Default: same pathname across locales. */
  languages?: Record<string, string>
  robots?: Metadata['robots']
  /** Merged into `alternates.types` (RSS discovery). */
  types?: NonNullable<Metadata['alternates']>['types']
}

/**
 * Layout title object: bare default for home, `%s — site` for child segments.
 */
export function localeTitleTemplate(siteTitle: string): NonNullable<Metadata['title']> {
  return {
    default: siteTitle,
    template: `%s — ${siteTitle}`,
  }
}

/**
 * hreflang map when each locale may use a different slug for the same document id.
 */
export function languageAlternatesFromSlugs(
  origin: string,
  segment: LocalizedSlugSegment,
  slugsByLocale: Partial<Record<AppLocale, string>>,
): Record<string, string> {
  const languages: Record<string, string> = {}

  for (const locale of routing.locales) {
    const slug = slugsByLocale[locale]
    if (typeof slug !== 'string' || slug.length === 0) continue
    languages[locale] = absolutePublicUrl(origin, `/${segment}/${slug}`, locale)
  }

  const fallback =
    languages[routing.defaultLocale] ??
    Object.values(languages)[0] ??
    absolutePublicUrl(origin, '/', routing.defaultLocale)
  languages['x-default'] = fallback

  return languages
}

/**
 * One Metadata payload: unique title, description, clean canonical, optional hreflang / robots / RSS.
 */
export function buildPageMetadata(args: BuildPageMetadataArgs): Metadata {
  const origin = (args.origin ?? getServerUrl()).replace(/\/$/, '')
  const languages = args.languages ?? languageAlternatesForPath(origin, args.pathname)
  const canonical = absolutePublicUrl(origin, args.pathname, args.locale)

  return {
    ...(args.description !== undefined ? { description: args.description } : {}),
    ...(args.robots !== undefined ? { robots: args.robots } : {}),
    alternates: {
      canonical,
      languages,
      ...(args.types ? { types: args.types } : {}),
    },
    title: args.absoluteTitle ? { absolute: args.title } : args.title,
  }
}

const localizedSlugSelect = {
  slug: true,
} as const

export type LocalizedContentSlugFindArgs = {
  collection: 'articles' | 'notes'
  depth: 0
  draft: false
  fallbackLocale: false
  limit: 1
  locale: AppLocale
  overrideAccess: false
  pagination: false
  select: typeof localizedSlugSelect
  where: Where
}

export type LocalizedTaxonomySlugFindArgs = {
  collection: 'categories' | 'tags'
  depth: 0
  fallbackLocale: false
  limit: 1
  locale: AppLocale
  overrideAccess: false
  pagination: false
  select: typeof localizedSlugSelect
  where: Where
}

/**
 * Sibling locale slug for a published article or note.
 * `fallbackLocale: false` so an empty locale does not borrow uk’s slug into the map.
 */
export function localizedContentSlugFindArgs(args: {
  collection: 'articles' | 'notes'
  id: number
  locale: string
  now?: Date
}): LocalizedContentSlugFindArgs {
  return {
    collection: args.collection,
    depth: 0,
    draft: false,
    fallbackLocale: false,
    limit: 1,
    locale: resolveContentLocale(args.locale),
    overrideAccess: false,
    pagination: false,
    select: localizedSlugSelect,
    where: {
      and: [{ id: { equals: args.id } }, publicContentWhere(args.now)],
    },
  }
}

/**
 * Sibling locale slug for a category or tag shelf.
 */
export function localizedTaxonomySlugFindArgs(args: {
  collection: 'categories' | 'tags'
  id: number
  locale: string
}): LocalizedTaxonomySlugFindArgs {
  return {
    collection: args.collection,
    depth: 0,
    fallbackLocale: false,
    limit: 1,
    locale: resolveContentLocale(args.locale),
    overrideAccess: false,
    pagination: false,
    select: localizedSlugSelect,
    where: { id: { equals: args.id } },
  }
}

export function slugFromLocalizedDoc(
  doc: { slug?: string | null } | null | undefined,
): string | null {
  if (typeof doc?.slug !== 'string' || doc.slug.length === 0) return null
  return doc.slug
}
