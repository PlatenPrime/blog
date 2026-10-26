import type { SerializedEditorState } from 'lexical'
import type { Where } from 'payload'

import { publicContentWhere } from '@/access/publicContentWhere'
import {
  numberedPageHref,
  pageCount,
  readPageParam,
  resolveNumberedPage,
  type NumberedPageHref,
  type NumberedPageResolution,
} from '@/content/numberedPage'
import {
  taxonomyLinks,
  type TaxonomyLink,
  type TaxonomyRelationLike,
} from '@/content/taxonomyLinks'
import { resolveContentLocale } from '@/i18n/contentLocale'
import type { AppLocale } from '@/i18n/routing'

/** Titles per notes page. Same size as articles and the mixed feed. */
export const NOTES_PAGE_SIZE = 10

const notesListSelect = {
  publishedAt: true,
  slug: true,
  title: true,
} as const

const notesDetailSelect = {
  body: true,
  categories: true,
  publishedAt: true,
  seo: {
    metaDescription: true,
    metaTitle: true,
  },
  slug: true,
  tags: true,
  title: true,
} as const

export type NotesCountArgs = {
  collection: 'notes'
  locale: AppLocale
  overrideAccess: false
  where: ReturnType<typeof publicContentWhere>
}

/**
 * List find for one SQL page.
 * `sort: '-publishedAt'` matches Postgres `DESC NULLS FIRST`: an empty date
 * stays ahead of any real instant, same as articles and the mixed feed.
 * No `user` and no `req`: an admin session must not widen this to drafts.
 */
export type NotesListFindArgs = {
  collection: 'notes'
  depth: 0
  draft: false
  fallbackLocale: 'uk'
  limit: typeof NOTES_PAGE_SIZE
  locale: AppLocale
  overrideAccess: false
  page: number
  pagination: true
  select: typeof notesListSelect
  sort: '-publishedAt'
  where: ReturnType<typeof publicContentWhere>
}

export type NotesDetailFindArgs = {
  collection: 'notes'
  depth: 1
  draft: false
  fallbackLocale: 'uk'
  limit: 1
  locale: AppLocale
  overrideAccess: false
  pagination: false
  select: typeof notesDetailSelect
  where: Where
}

export type NotesPageHref = NumberedPageHref<'/notes'>

export type NotesPageResolution = NumberedPageResolution

export type PublicNote = {
  body: SerializedEditorState
  categories: TaxonomyLink[]
  metaDescription: string | null
  metaTitle: string | null
  publishedAt: string | null
  tags: TaxonomyLink[]
  title: string
}

export type NoteDetailSource = {
  body?: unknown
  categories?: readonly TaxonomyRelationLike[] | null
  publishedAt?: string | null
  seo?: { metaDescription?: string | null; metaTitle?: string | null } | null
  tags?: readonly TaxonomyRelationLike[] | null
  title?: string | null
}

/**
 * Count arguments for the public note list.
 * No `user` and no `req`. `count` has no `draft` flag; `where` is the visibility rule.
 */
export function notesCountArgs(args: { locale: string; now?: Date }): NotesCountArgs {
  return {
    collection: 'notes',
    locale: resolveContentLocale(args.locale),
    overrideAccess: false,
    where: publicContentWhere(args.now),
  }
}

export function notesListFindArgs(args: {
  locale: string
  now?: Date
  page: number
}): NotesListFindArgs {
  return {
    collection: 'notes',
    depth: 0,
    draft: false,
    fallbackLocale: 'uk',
    limit: NOTES_PAGE_SIZE,
    locale: resolveContentLocale(args.locale),
    overrideAccess: false,
    page: args.page,
    pagination: true,
    select: notesListSelect,
    sort: '-publishedAt',
    where: publicContentWhere(args.now),
  }
}

/**
 * One public note by its localized slug.
 * `depth: 1` populates taxonomy links. An id-only relation is dropped later.
 * Notes have no cover: that field belongs to articles.
 */
export function notesDetailFindArgs(args: {
  locale: string
  now?: Date
  slug: string
}): NotesDetailFindArgs {
  return {
    collection: 'notes',
    depth: 1,
    draft: false,
    fallbackLocale: 'uk',
    limit: 1,
    locale: resolveContentLocale(args.locale),
    overrideAccess: false,
    pagination: false,
    select: notesDetailSelect,
    where: {
      and: [{ slug: { equals: args.slug } }, publicContentWhere(args.now)],
    },
  }
}

export function notesPageCount(total: number): number {
  return pageCount(total, NOTES_PAGE_SIZE)
}

export function readNotesPageParam(page: string | string[] | undefined): string | undefined {
  return readPageParam(page)
}

export function resolveNotesPage(raw: string | undefined, total: number): NotesPageResolution {
  return resolveNumberedPage(raw, total, NOTES_PAGE_SIZE)
}

export function notesPageHref(page: number): NotesPageHref {
  return numberedPageHref('/notes', page)
}

/**
 * A row the reading page can render.
 * Blank SEO text is unset, so the visible title and the site description stay in charge.
 * A document without a title or a Lexical body is not a page.
 */
export function toPublicNote(doc: NoteDetailSource): PublicNote | null {
  if (typeof doc.title !== 'string' || doc.title.length === 0) return null
  if (!isEditorState(doc.body)) return null

  const publishedAt =
    typeof doc.publishedAt === 'string' && doc.publishedAt.length > 0 ? doc.publishedAt : null

  return {
    body: doc.body,
    categories: taxonomyLinks(doc.categories),
    metaDescription: blankToNull(doc.seo?.metaDescription),
    metaTitle: blankToNull(doc.seo?.metaTitle),
    publishedAt,
    tags: taxonomyLinks(doc.tags),
    title: doc.title,
  }
}

function blankToNull(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function isEditorState(value: unknown): value is SerializedEditorState {
  return typeof value === 'object' && value !== null && 'root' in value
}
