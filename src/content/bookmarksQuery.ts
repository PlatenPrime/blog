import { APIError, type Where } from 'payload'

import { publicContentWhere } from '@/access/publicContentWhere'
import { normalizeBookmarkContent } from '@/collections/bookmarkUniqueness'
import { resolveContentLocale } from '@/i18n/contentLocale'
import type { AppLocale } from '@/i18n/routing'

/** Newest bookmarks kept on the personal page. Older ones stay in the database. */
export const BOOKMARK_LIST_LIMIT = 100

export type BookmarkRelation = 'articles' | 'notes'

export type BookmarkListItem = {
  collection: BookmarkRelation
  contentId: number
  publishedAt: string | null
  slug: string
  title: string
}

/** `409` means the row is already there. `404` means the delete found nothing. */
export type BookmarkWriteFailure = 'failed' | 'gone' | 'saved'

type BookmarkOwner = {
  id: number
}

const bookmarkListSelect = {
  content: true,
} as const

const bookmarkTitleSelect = {
  publishedAt: true,
  slug: true,
  title: true,
} as const

export type BookmarksListFindArgs<TUser extends BookmarkOwner> = {
  collection: 'bookmarks'
  depth: 0
  limit: typeof BOOKMARK_LIST_LIMIT
  overrideAccess: false
  pagination: false
  select: typeof bookmarkListSelect
  sort: '-createdAt'
  user: TUser
  where: Where
}

export type BookmarkForContentFindArgs<TUser extends BookmarkOwner> = {
  collection: 'bookmarks'
  depth: 0
  limit: 1
  overrideAccess: false
  pagination: false
  user: TUser
  where: Where
}

type BookmarkTitlesFindBase = {
  depth: 0
  draft: false
  fallbackLocale: 'uk'
  limit: number
  locale: AppLocale
  overrideAccess: false
  pagination: false
  select: typeof bookmarkTitleSelect
  where: Where
}

export type ArticleBookmarkTitlesFindArgs = BookmarkTitlesFindBase & { collection: 'articles' }

export type NoteBookmarkTitlesFindArgs = BookmarkTitlesFindBase & { collection: 'notes' }

/**
 * This user's bookmarks, newest first.
 * `where.user` stays even for an admin: `isOwnerOrAdmin` would otherwise return every row.
 * The `user` option is the session, so access still runs. No `req`.
 */
export function bookmarksListFindArgs<TUser extends BookmarkOwner>(
  user: TUser,
): BookmarksListFindArgs<TUser> {
  return {
    collection: 'bookmarks',
    depth: 0,
    limit: BOOKMARK_LIST_LIMIT,
    overrideAccess: false,
    pagination: false,
    select: bookmarkListSelect,
    sort: '-createdAt',
    user,
    where: {
      user: { equals: user.id },
    },
  }
}

/**
 * One bookmark of this user on one article or note.
 * `where` repeats the owner, so an admin session cannot match someone else's row.
 */
export function bookmarkForContentFindArgs<TUser extends BookmarkOwner>(args: {
  relationTo: BookmarkRelation
  user: TUser
  value: number
}): BookmarkForContentFindArgs<TUser> {
  return {
    collection: 'bookmarks',
    depth: 0,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    user: args.user,
    where: {
      and: [
        { user: { equals: args.user.id } },
        { 'content.relationTo': { equals: args.relationTo } },
        { 'content.value': { equals: args.value } },
      ],
    },
  }
}

/**
 * Titles for bookmark rows. No `user` and no `req`: an admin session must not
 * turn a draft the reader saved into a line on the personal page.
 */
export function bookmarkTitlesFindArgs(args: {
  collection: 'articles'
  ids: readonly number[]
  locale: string
  now?: Date
}): ArticleBookmarkTitlesFindArgs
export function bookmarkTitlesFindArgs(args: {
  collection: 'notes'
  ids: readonly number[]
  locale: string
  now?: Date
}): NoteBookmarkTitlesFindArgs
export function bookmarkTitlesFindArgs(args: {
  collection: BookmarkRelation
  ids: readonly number[]
  locale: string
  now?: Date
}): ArticleBookmarkTitlesFindArgs | NoteBookmarkTitlesFindArgs {
  return {
    collection: args.collection,
    depth: 0,
    draft: false,
    fallbackLocale: 'uk',
    limit: Math.min(Math.max(args.ids.length, 1), BOOKMARK_LIST_LIMIT),
    locale: resolveContentLocale(args.locale),
    overrideAccess: false,
    pagination: false,
    select: bookmarkTitleSelect,
    where: {
      and: [{ id: { in: [...args.ids] } }, publicContentWhere(args.now)],
    },
  }
}

/**
 * Create conflict is already saved. Delete of a missing row is already gone.
 * Any other failure stays a failure: the page must not treat it as success.
 */
export function bookmarkWriteFailure(error: unknown): BookmarkWriteFailure {
  if (error instanceof APIError && error.status === 409) return 'saved'
  if (error instanceof APIError && error.status === 404) return 'gone'
  return 'failed'
}

type PublicTitle = {
  id: number
  publishedAt: string | null
  slug: string
  title: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function contentId(value: number | string): number | null {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return value
  if (typeof value === 'string' && /^[1-9]\d*$/.test(value)) {
    const id = Number(value)
    if (Number.isSafeInteger(id)) return id
  }
  return null
}

function bookmarkTarget(
  doc: unknown,
): { id: number; relationTo: BookmarkRelation; value: number } | null {
  if (!isRecord(doc) || typeof doc.id !== 'number') return null

  const content = normalizeBookmarkContent(doc.content)
  if (!content) return null

  const value = contentId(content.value)
  if (value == null) return null

  return { id: doc.id, relationTo: content.relationTo, value }
}

function toPublicTitle(doc: unknown): PublicTitle | null {
  if (!isRecord(doc)) return null
  if (typeof doc.id !== 'number' || !Number.isSafeInteger(doc.id) || doc.id <= 0) return null
  if (typeof doc.title !== 'string' || doc.title.length === 0) return null
  if (typeof doc.slug !== 'string' || doc.slug.length === 0) return null

  const publishedAt =
    typeof doc.publishedAt === 'string' && doc.publishedAt.length > 0 ? doc.publishedAt : null

  return { id: doc.id, publishedAt, slug: doc.slug, title: doc.title }
}

function titleKey(relationTo: BookmarkRelation, id: number): string {
  return `${relationTo}:${id}`
}

/**
 * Ids to resolve, split by collection. A bookmark with no content id is skipped.
 */
export function bookmarkContentIds(docs: readonly unknown[]): {
  articles: number[]
  notes: number[]
} {
  const articles: number[] = []
  const notes: number[] = []

  for (const doc of docs) {
    const target = bookmarkTarget(doc)
    if (!target) continue
    if (target.relationTo === 'articles') articles.push(target.value)
    else notes.push(target.value)
  }

  return { articles, notes }
}

/**
 * Bookmark order, joined to public titles.
 * A row whose article or note is missing, draft, or has no slug is omitted.
 * The bookmark document itself is left in the database.
 */
export function toBookmarkListItems(
  bookmarks: readonly unknown[],
  articles: readonly unknown[],
  notes: readonly unknown[],
): BookmarkListItem[] {
  const titles = new Map<string, PublicTitle>()

  for (const doc of articles) {
    const title = toPublicTitle(doc)
    if (title) titles.set(titleKey('articles', title.id), title)
  }

  for (const doc of notes) {
    const title = toPublicTitle(doc)
    if (title) titles.set(titleKey('notes', title.id), title)
  }

  const items: BookmarkListItem[] = []

  for (const bookmark of bookmarks) {
    const target = bookmarkTarget(bookmark)
    if (!target) continue

    const title = titles.get(titleKey(target.relationTo, target.value))
    if (!title) continue

    items.push({
      collection: target.relationTo,
      contentId: target.value,
      publishedAt: title.publishedAt,
      slug: title.slug,
      title: title.title,
    })
  }

  return items
}
