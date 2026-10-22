/**
 * Allowlisted draft-preview paths (roadmap 035).
 * Temporary `/{locale}/dev/rich-text/...` until Track 5 public routes.
 */

import { isAppLocale } from '@/i18n/paths'
import { routing } from '@/i18n/routing'

export const PREVIEW_COLLECTIONS = ['articles', 'notes', 'pages'] as const

export type PreviewCollection = (typeof PREVIEW_COLLECTIONS)[number]

/** Slug segment: lowercase letters, digits, hyphens (matches slugify output). */
const SLUG_SEGMENT_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const COLLECTION_TO_SEGMENT: Record<PreviewCollection, string> = {
  articles: 'article',
  notes: 'note',
  pages: 'page',
}

const SEGMENT_TO_COLLECTION: Record<string, PreviewCollection> = {
  article: 'articles',
  note: 'notes',
  page: 'pages',
}

const LOCALE_ALTERNATION = routing.locales.join('|')

const PREVIEW_PATH_RE = new RegExp(
  `^/(${LOCALE_ALTERNATION})/dev/rich-text/(article|note|page)/([a-z0-9]+(?:-[a-z0-9]+)*)$`,
)

export function isPreviewCollection(value: unknown): value is PreviewCollection {
  return typeof value === 'string' && (PREVIEW_COLLECTIONS as readonly string[]).includes(value)
}

export function isValidPreviewSlug(slug: unknown): slug is string {
  return typeof slug === 'string' && SLUG_SEGMENT_RE.test(slug)
}

/**
 * Build a relative preview path for an allowlisted collection + slug (default locale).
 */
export function buildPreviewPath(args: {
  collection: PreviewCollection
  slug: string
}): string | null {
  if (!isValidPreviewSlug(args.slug)) return null
  if (!isPreviewCollection(args.collection)) return null

  const segment = COLLECTION_TO_SEGMENT[args.collection]
  return `/${routing.defaultLocale}/dev/rich-text/${segment}/${args.slug}`
}

/**
 * Strict allowlist check — blocks open redirects (`//evil`, absolute URLs, unknown prefixes).
 */
export function isAllowedPreviewPath(path: unknown): boolean {
  if (typeof path !== 'string') return false
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return false
  if (path.includes('://') || path.includes('..')) return false

  const match = PREVIEW_PATH_RE.exec(path)
  if (!match) return false

  const locale = match[1]!
  const segment = match[2]!
  return isAppLocale(locale) && segment in SEGMENT_TO_COLLECTION
}
