import type { SerializedEditorState } from 'lexical'
import type { Where } from 'payload'

import { publicContentWhere } from '@/access/publicContentWhere'
import { resolveContentLocale } from '@/i18n/contentLocale'
import type { AppLocale } from '@/i18n/routing'

/**
 * Public path and CMS slug for the author page.
 * The path stays `/about` in every locale. A translated title must not rename this slug.
 * Privacy and terms reuse this find later and get their own routes (079–080).
 */
export const ABOUT_PAGE_SLUG = 'about'

const pageDetailSelect = {
  body: true,
  seo: {
    metaDescription: true,
    metaTitle: true,
  },
  slug: true,
  title: true,
} as const

export type PageDetailFindArgs = {
  collection: 'pages'
  depth: 1
  draft: false
  fallbackLocale: 'uk'
  limit: 1
  locale: AppLocale
  overrideAccess: false
  pagination: false
  select: typeof pageDetailSelect
  where: Where
}

export type PublicPage = {
  body: SerializedEditorState
  metaDescription: string | null
  metaTitle: string | null
  title: string
}

export type PageDetailSource = {
  body?: unknown
  seo?: { metaDescription?: string | null; metaTitle?: string | null } | null
  slug?: string | null
  title?: string | null
}

/**
 * One public CMS page by its localized slug.
 * `depth: 1` populates uploads inside the Lexical body. Pages have no cover and no taxonomy.
 * No `user` and no `req`: an admin session must not widen this to drafts.
 */
export function pageDetailFindArgs(args: {
  locale: string
  now?: Date
  slug: string
}): PageDetailFindArgs {
  return {
    collection: 'pages',
    depth: 1,
    draft: false,
    fallbackLocale: 'uk',
    limit: 1,
    locale: resolveContentLocale(args.locale),
    overrideAccess: false,
    pagination: false,
    select: pageDetailSelect,
    where: {
      and: [{ slug: { equals: args.slug } }, publicContentWhere(args.now)],
    },
  }
}

/**
 * A row the author page can render.
 * Blank SEO text is unset, so the visible title and the site description stay in charge.
 * A document without a title or a Lexical body is not a page.
 * A locale that stored its own slug, and that slug is not the public one, is not this path.
 * An empty slug is the fallback locale: `fallbackLocale` fills it, so it still matches.
 */
export function publicPageForLocale(doc: PageDetailSource, slug: string): PublicPage | null {
  if (typeof doc.slug === 'string' && doc.slug.length > 0 && doc.slug !== slug) return null
  return toPublicPage(doc)
}

export function toPublicPage(doc: PageDetailSource): PublicPage | null {
  if (typeof doc.title !== 'string' || doc.title.length === 0) return null
  if (!isEditorState(doc.body)) return null

  return {
    body: doc.body,
    metaDescription: blankToNull(doc.seo?.metaDescription),
    metaTitle: blankToNull(doc.seo?.metaTitle),
    title: doc.title,
  }
}

const contactEmailPattern = /^[A-Za-z0-9._+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

/**
 * Optional mailto for the about page. Empty or junk is no link.
 * One plain address only: no newline, no `?`, no subject, no newsletter.
 */
export function contactMailto(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null

  const email = raw.trim()
  if (email.length === 0 || email.length > 254) return null
  if (email.includes('..')) return null
  if (!contactEmailPattern.test(email)) return null

  return `mailto:${email}`
}

function blankToNull(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function isEditorState(value: unknown): value is SerializedEditorState {
  return typeof value === 'object' && value !== null && 'root' in value
}
