/** @vitest-environment node */
import { APIError } from 'payload'
import { describe, expect, it } from 'vitest'

import { publicContentWhere } from '@/access/publicContentWhere'
import {
  BOOKMARK_LIST_LIMIT,
  bookmarkContentIds,
  bookmarkForContentFindArgs,
  bookmarkTitlesFindArgs,
  bookmarkWriteFailure,
  bookmarksListFindArgs,
  toBookmarkListItems,
} from '@/content/bookmarksQuery'

const now = new Date('2026-10-26T12:00:00.000Z')
const user = { id: 7 }

describe('bookmarksListFindArgs', () => {
  it('loads this user only, even when that user is an admin', () => {
    const args = bookmarksListFindArgs(user)

    expect(args).toEqual({
      collection: 'bookmarks',
      depth: 0,
      limit: BOOKMARK_LIST_LIMIT,
      overrideAccess: false,
      pagination: false,
      select: { content: true },
      sort: '-createdAt',
      user,
      where: { user: { equals: 7 } },
    })
    expect(args.limit).toBe(100)
    expect(args).not.toHaveProperty('req')
    expect(args.where).toEqual({ user: { equals: user.id } })
  })
})

describe('bookmarkForContentFindArgs', () => {
  it('matches one article for this user and not another owner', () => {
    const args = bookmarkForContentFindArgs({ relationTo: 'articles', user, value: 12 })

    expect(args.limit).toBe(1)
    expect(args.overrideAccess).toBe(false)
    expect(args.user).toBe(user)
    expect(args).not.toHaveProperty('req')
    expect(args.where).toEqual({
      and: [
        { user: { equals: 7 } },
        { 'content.relationTo': { equals: 'articles' } },
        { 'content.value': { equals: 12 } },
      ],
    })
  })

  it('keeps a note on its own relation', () => {
    const args = bookmarkForContentFindArgs({ relationTo: 'notes', user, value: 4 })

    expect(args.where).toEqual({
      and: [
        { user: { equals: 7 } },
        { 'content.relationTo': { equals: 'notes' } },
        { 'content.value': { equals: 4 } },
      ],
    })
  })
})

describe('bookmarkTitlesFindArgs', () => {
  it('asks for public article titles and never the session', () => {
    const args = bookmarkTitlesFindArgs({
      collection: 'articles',
      ids: [12, 4],
      locale: 'fr',
      now,
    })

    expect(args).toEqual({
      collection: 'articles',
      depth: 0,
      draft: false,
      fallbackLocale: 'uk',
      limit: 2,
      locale: 'uk',
      overrideAccess: false,
      pagination: false,
      select: {
        publishedAt: true,
        slug: true,
        title: true,
      },
      where: {
        and: [{ id: { in: [12, 4] } }, publicContentWhere(now)],
      },
    })
    expect(args).not.toHaveProperty('user')
    expect(args).not.toHaveProperty('req')
  })

  it('uses the same rule for notes', () => {
    const args = bookmarkTitlesFindArgs({ collection: 'notes', ids: [4], locale: 'en', now })

    expect(args.collection).toBe('notes')
    expect(args.locale).toBe('en')
    expect(args.draft).toBe(false)
    expect(args.limit).toBe(1)
    expect(args.where).toEqual({
      and: [{ id: { in: [4] } }, publicContentWhere(now)],
    })
  })
})

describe('bookmarkContentIds', () => {
  it('splits article and note ids and skips a row with no target', () => {
    expect(
      bookmarkContentIds([
        { content: { relationTo: 'articles', value: 12 }, id: 1 },
        { content: { relationTo: 'notes', value: '4' }, id: 2 },
        { content: { relationTo: 'pages', value: 3 }, id: 3 },
        { id: 4 },
      ]),
    ).toEqual({ articles: [12], notes: [4] })
  })
})

describe('toBookmarkListItems', () => {
  it('keeps bookmark order and drops a target that is not public', () => {
    const items = toBookmarkListItems(
      [
        { content: { relationTo: 'notes', value: 4 }, id: 20 },
        { content: { relationTo: 'articles', value: 12 }, id: 10 },
        { content: { relationTo: 'articles', value: 99 }, id: 30 },
      ],
      [
        {
          email: 'secret@example.com',
          id: 12,
          publishedAt: '2020-01-15T12:00:00.000Z',
          slug: 'public-article',
          title: 'Public article',
        },
      ],
      [
        {
          id: 4,
          publishedAt: null,
          slug: 'public-note',
          title: 'Public note',
        },
      ],
    )

    expect(items).toEqual([
      {
        collection: 'notes',
        contentId: 4,
        publishedAt: null,
        slug: 'public-note',
        title: 'Public note',
      },
      {
        collection: 'articles',
        contentId: 12,
        publishedAt: '2020-01-15T12:00:00.000Z',
        slug: 'public-article',
        title: 'Public article',
      },
    ])
    expect(JSON.stringify(items)).not.toContain('secret@example.com')
  })

  it('does not treat a note id as an article, or a title without a slug as a line', () => {
    const items = toBookmarkListItems(
      [
        { content: { relationTo: 'articles', value: 4 }, id: 1 },
        { content: { relationTo: 'notes', value: 8 }, id: 2 },
      ],
      [],
      [
        { id: 4, slug: 'note-four', title: 'Note four' },
        { id: 8, slug: '', title: 'No slug' },
      ],
    )

    expect(items).toEqual([])
  })
})

describe('bookmarkWriteFailure', () => {
  it('treats a duplicate as saved and a missing delete as gone', () => {
    expect(bookmarkWriteFailure(new APIError('exists', 409))).toBe('saved')
    expect(bookmarkWriteFailure(new APIError('missing', 404))).toBe('gone')
    expect(bookmarkWriteFailure(new APIError('nope', 403))).toBe('failed')
    expect(bookmarkWriteFailure(new Error('exists'))).toBe('failed')
  })
})
