/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import { publicContentWhere } from '@/access/publicContentWhere'
import {
  COMMENT_BODY_MAX,
  COMMENT_LIST_LIMIT,
  commentTargetFindArgs,
  commentsFindArgs,
  normalizeCommentBody,
  readCommentTarget,
  toPublicComment,
  toPublicComments,
} from '@/content/commentsQuery'

const now = new Date('2026-10-26T12:00:00.000Z')

describe('commentsFindArgs', () => {
  it('loads the newest approved comments for one document and never the session', () => {
    const args = commentsFindArgs({ relationTo: 'articles', value: 12 })

    expect(args).toEqual({
      collection: 'comments',
      depth: 0,
      limit: COMMENT_LIST_LIMIT,
      overrideAccess: false,
      pagination: false,
      select: {
        author: true,
        body: true,
        createdAt: true,
      },
      sort: '-createdAt',
      where: {
        and: [
          { moderationStatus: { equals: 'approved' } },
          { 'content.relationTo': { equals: 'articles' } },
          { 'content.value': { equals: 12 } },
        ],
      },
    })
    expect(args.limit).toBe(100)
    expect(args).not.toHaveProperty('user')
    expect(args).not.toHaveProperty('req')
    expect(args.select).not.toHaveProperty('moderationStatus')
  })

  it('keeps notes on their own relation', () => {
    const args = commentsFindArgs({ relationTo: 'notes', value: 4 })

    expect(args.where).toEqual({
      and: [
        { moderationStatus: { equals: 'approved' } },
        { 'content.relationTo': { equals: 'notes' } },
        { 'content.value': { equals: 4 } },
      ],
    })
  })
})

describe('commentTargetFindArgs', () => {
  it('asks whether this article is already public', () => {
    const args = commentTargetFindArgs({
      locale: 'fr',
      now,
      relationTo: 'articles',
      value: 12,
    })

    expect(args).toEqual({
      collection: 'articles',
      depth: 0,
      draft: false,
      fallbackLocale: 'uk',
      limit: 1,
      locale: 'uk',
      overrideAccess: false,
      pagination: false,
      where: {
        and: [{ id: { equals: 12 } }, publicContentWhere(now)],
      },
    })
    expect(args).not.toHaveProperty('user')
    expect(args).not.toHaveProperty('req')
  })

  it('uses the same rule for a note', () => {
    const args = commentTargetFindArgs({ locale: 'en', now, relationTo: 'notes', value: 4 })

    expect(args.collection).toBe('notes')
    expect(args.locale).toBe('en')
    expect(args.draft).toBe(false)
    expect(args.where).toEqual({
      and: [{ id: { equals: 4 } }, publicContentWhere(now)],
    })
  })
})

describe('readCommentTarget', () => {
  it('accepts an article or note id', () => {
    expect(readCommentTarget('articles', '12')).toEqual({ relationTo: 'articles', value: 12 })
    expect(readCommentTarget('notes', '4')).toEqual({ relationTo: 'notes', value: 4 })
  })

  it('rejects a relation or id the form is not allowed to invent', () => {
    expect(readCommentTarget('pages', '1')).toBeNull()
    expect(readCommentTarget('articles', '0')).toBeNull()
    expect(readCommentTarget('articles', '-1')).toBeNull()
    expect(readCommentTarget('articles', '1.5')).toBeNull()
    expect(readCommentTarget('articles', '1e2')).toBeNull()
    expect(readCommentTarget('articles', '')).toBeNull()
    expect(readCommentTarget('articles', '01')).toBeNull()
  })
})

describe('normalizeCommentBody', () => {
  it('trims a comment and keeps a body at the cap', () => {
    expect(normalizeCommentBody('  hello  ')).toEqual({ body: 'hello', ok: true })
    expect(normalizeCommentBody('a'.repeat(COMMENT_BODY_MAX))).toEqual({
      body: 'a'.repeat(COMMENT_BODY_MAX),
      ok: true,
    })
  })

  it('rejects an empty or oversized body', () => {
    expect(normalizeCommentBody('   ')).toEqual({ ok: false, reason: 'empty' })
    expect(normalizeCommentBody('')).toEqual({ ok: false, reason: 'empty' })
    expect(normalizeCommentBody('a'.repeat(COMMENT_BODY_MAX + 1))).toEqual({
      ok: false,
      reason: 'tooLong',
    })
  })
})

describe('toPublicComment', () => {
  it('labels the viewer without copying an email off the author', () => {
    const comment = toPublicComment(
      {
        author: { email: 'secret@example.com', id: 9 },
        body: 'Hi',
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 1,
      },
      9,
    )

    expect(comment).toEqual({
      authorLabel: 'you',
      body: 'Hi',
      createdAt: '2026-01-01T00:00:00.000Z',
      id: 1,
    })
    expect(JSON.stringify(comment)).not.toContain('secret@example.com')
  })

  it('matches a string viewer id to a numeric author', () => {
    expect(
      toPublicComment({ author: 9, body: 'Hi', createdAt: '2026-01-01T00:00:00.000Z', id: 1 }, '9')
        ?.authorLabel,
    ).toBe('you')
  })

  it('calls everyone else a reader, including a comment with no author id', () => {
    expect(
      toPublicComment({ author: 4, body: 'Hi', createdAt: '2026-01-01T00:00:00.000Z', id: 1 }, 9)
        ?.authorLabel,
    ).toBe('reader')
    expect(
      toPublicComment({ body: 'Hi', createdAt: '2026-01-01T00:00:00.000Z', id: 1 }, 9)?.authorLabel,
    ).toBe('reader')
  })

  it('drops a row the page cannot render', () => {
    expect(toPublicComment(null, null)).toBeNull()
    expect(toPublicComment({ body: 'Hi', createdAt: '2026-01-01T00:00:00.000Z' }, null)).toBeNull()
    expect(
      toPublicComment({ body: '', createdAt: '2026-01-01T00:00:00.000Z', id: 1 }, null),
    ).toBeNull()
    expect(toPublicComment({ body: 'Hi', id: 1 }, null)).toBeNull()
  })
})

describe('toPublicComments', () => {
  it('shows the newest window oldest first', () => {
    const comments = toPublicComments(
      [
        { author: 1, body: 'newer', createdAt: '2026-02-01T00:00:00.000Z', id: 2 },
        { author: 4, body: 'older', createdAt: '2026-01-01T00:00:00.000Z', id: 1 },
      ],
      4,
    )

    expect(comments.map((comment) => comment.id)).toEqual([1, 2])
    expect(comments.map((comment) => comment.authorLabel)).toEqual(['you', 'reader'])
  })
})
