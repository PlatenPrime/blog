import type { Where } from 'payload'

import { publicContentWhere } from '@/access/publicContentWhere'
import { resolveContentLocale } from '@/i18n/contentLocale'
import type { AppLocale } from '@/i18n/routing'

/** Newest comments kept on one reading page. Older ones stay in the admin. */
export const COMMENT_LIST_LIMIT = 100

/** Plain-text cap. The textarea and the server action share this number. */
export const COMMENT_BODY_MAX = 2000

const commentsListSelect = {
  author: true,
  body: true,
  createdAt: true,
} as const

export type CommentRelation = 'articles' | 'notes'

export type CommentTarget = {
  relationTo: CommentRelation
  value: number
}

export type CommentAuthorLabel = 'you' | 'reader'

export type PublicComment = {
  authorLabel: CommentAuthorLabel
  body: string
  createdAt: string
  id: number
}

export type CommentsFindArgs = {
  collection: 'comments'
  depth: 0
  limit: typeof COMMENT_LIST_LIMIT
  overrideAccess: false
  pagination: false
  select: typeof commentsListSelect
  sort: '-createdAt'
  where: Where
}

type CommentTargetFindBase = {
  depth: 0
  draft: false
  fallbackLocale: 'uk'
  limit: 1
  locale: AppLocale
  overrideAccess: false
  pagination: false
  where: Where
}

export type ArticleCommentTargetFindArgs = CommentTargetFindBase & { collection: 'articles' }

export type NoteCommentTargetFindArgs = CommentTargetFindBase & { collection: 'notes' }

export type CommentBodyResult =
  { body: string; ok: true } | { ok: false; reason: 'empty' | 'tooLong' }

/**
 * Approved comments on one article or note.
 * No `user` and no `req`: an admin session must not widen this to hidden rows.
 * `depth: 0` leaves `author` as an id. The users collection is not readable here.
 */
export function commentsFindArgs(target: CommentTarget): CommentsFindArgs {
  return {
    collection: 'comments',
    depth: 0,
    limit: COMMENT_LIST_LIMIT,
    overrideAccess: false,
    pagination: false,
    select: commentsListSelect,
    sort: '-createdAt',
    where: {
      and: [
        { moderationStatus: { equals: 'approved' } },
        { 'content.relationTo': { equals: target.relationTo } },
        { 'content.value': { equals: target.value } },
      ],
    },
  }
}

/**
 * The article or note must already be public before a comment can attach to it.
 * No `user` and no `req`.
 */
export function commentTargetFindArgs(args: {
  locale: string
  now?: Date
  relationTo: 'articles'
  value: number
}): ArticleCommentTargetFindArgs
export function commentTargetFindArgs(args: {
  locale: string
  now?: Date
  relationTo: 'notes'
  value: number
}): NoteCommentTargetFindArgs
export function commentTargetFindArgs(args: {
  locale: string
  now?: Date
  relationTo: CommentRelation
  value: number
}): ArticleCommentTargetFindArgs | NoteCommentTargetFindArgs {
  return {
    collection: args.relationTo,
    depth: 0,
    draft: false,
    fallbackLocale: 'uk',
    limit: 1,
    locale: resolveContentLocale(args.locale),
    overrideAccess: false,
    pagination: false,
    where: {
      and: [{ id: { equals: args.value } }, publicContentWhere(args.now)],
    },
  }
}

/**
 * Id and relation from the form. Anything else is not a comment target.
 */
export function readCommentTarget(relationTo: string, rawId: string): CommentTarget | null {
  if (relationTo !== 'articles' && relationTo !== 'notes') return null
  if (!/^[1-9]\d*$/.test(rawId)) return null

  const value = Number(rawId)
  if (!Number.isSafeInteger(value)) return null

  return { relationTo, value }
}

/**
 * Trimmed plain text, or why it cannot be stored.
 */
export function normalizeCommentBody(raw: string): CommentBodyResult {
  const body = raw.trim()
  if (body.length === 0) return { ok: false, reason: 'empty' }
  if (body.length > COMMENT_BODY_MAX) return { ok: false, reason: 'tooLong' }
  return { ok: true, body }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function authorIdOf(author: unknown): number | string | null {
  if (typeof author === 'number') return author
  if (typeof author === 'string' && author.length > 0) return author
  if (!isRecord(author)) return null

  const id = author.id
  if (typeof id === 'number' || (typeof id === 'string' && id.length > 0)) return id
  return null
}

function commentAuthorLabel(
  authorId: number | string | null,
  viewerId: number | string | null,
): CommentAuthorLabel {
  if (viewerId == null || authorId == null) return 'reader'
  return String(authorId) === String(viewerId) ? 'you' : 'reader'
}

/**
 * One row the page can render.
 * Email on a populated author is ignored: the public list must not print it.
 */
export function toPublicComment(
  doc: unknown,
  viewerId: number | string | null,
): PublicComment | null {
  if (!isRecord(doc)) return null
  if (typeof doc.id !== 'number') return null
  if (typeof doc.body !== 'string' || doc.body.length === 0) return null
  if (typeof doc.createdAt !== 'string' || doc.createdAt.length === 0) return null

  return {
    authorLabel: commentAuthorLabel(authorIdOf(doc.author), viewerId),
    body: doc.body,
    createdAt: doc.createdAt,
    id: doc.id,
  }
}

/**
 * Find order is newest first. The page shows that window oldest first.
 */
export function toPublicComments(
  docs: readonly unknown[],
  viewerId: number | string | null,
): PublicComment[] {
  const comments: PublicComment[] = []

  for (const doc of docs) {
    const comment = toPublicComment(doc, viewerId)
    if (comment) comments.push(comment)
  }

  comments.reverse()
  return comments
}
