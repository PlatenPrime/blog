/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import { publicContentWhere } from '@/access/publicContentWhere'
import {
  FEED_PAGE_SIZE,
  feedCountArgs,
  feedFindArgs,
  feedPageHref,
  mergePublicFeed,
  readFeedPageParam,
  resolveFeedPage,
} from '@/content/feedQuery'
import { latestPublicFindArgs, type LatestPublicDoc } from '@/content/latestPublicQuery'

const now = new Date('2026-10-26T12:00:00.000Z')

function doc(slug: string, publishedAt: string | null): LatestPublicDoc {
  return { publishedAt, slug, title: slug }
}

describe('feedFindArgs', () => {
  it('reuses the home visibility contract and widens the limit to the page window', () => {
    const args = feedFindArgs({ collection: 'articles', locale: 'ru', now, page: 2 })

    expect(args).toEqual(
      latestPublicFindArgs({
        collection: 'articles',
        limit: 2 * FEED_PAGE_SIZE,
        locale: 'ru',
        now,
      }),
    )
    expect(args.draft).toBe(false)
    expect(args.overrideAccess).toBe(false)
    expect(args.where).toEqual(publicContentWhere(now))
    expect(args).not.toHaveProperty('user')
    expect(args).not.toHaveProperty('req')
  })
})

describe('feedCountArgs', () => {
  it('counts with the same where and never the session user', () => {
    const args = feedCountArgs({ collection: 'notes', locale: 'fr', now })

    expect(args).toEqual({
      collection: 'notes',
      locale: 'uk',
      overrideAccess: false,
      where: publicContentWhere(now),
    })
    expect(args).not.toHaveProperty('user')
    expect(args).not.toHaveProperty('req')
    expect(args).not.toHaveProperty('draft')
  })
})

describe('resolveFeedPage', () => {
  it('renders the first page when the query is absent, including an empty feed', () => {
    expect(resolveFeedPage(undefined, 0)).toEqual({ kind: 'render', page: 1 })
    expect(resolveFeedPage(undefined, 25)).toEqual({ kind: 'render', page: 1 })
  })

  it('sends page 1, garbage, and a non-positive page to the canonical url', () => {
    for (const raw of ['1', '0', '-1', '1.5', '02', 'abc', '', ' 2']) {
      expect(resolveFeedPage(raw, 25)).toEqual({ kind: 'redirect', page: null })
    }
  })

  it('sends an empty feed past page 1 back to the canonical url', () => {
    expect(resolveFeedPage('2', 0)).toEqual({ kind: 'redirect', page: null })
    expect(resolveFeedPage('2', FEED_PAGE_SIZE)).toEqual({ kind: 'redirect', page: null })
  })

  it('renders an in-range page and clamps past the end to the last page', () => {
    expect(resolveFeedPage('2', 25)).toEqual({ kind: 'render', page: 2 })
    expect(resolveFeedPage('3', 25)).toEqual({ kind: 'render', page: 3 })
    expect(resolveFeedPage('4', 25)).toEqual({ kind: 'redirect', page: 3 })
  })
})

describe('readFeedPageParam', () => {
  it('keeps a single value and the first of a repeated param', () => {
    expect(readFeedPageParam(undefined)).toBeUndefined()
    expect(readFeedPageParam('2')).toBe('2')
    expect(readFeedPageParam(['2', '9'])).toBe('2')
    expect(readFeedPageParam([])).toBeUndefined()
  })
})

describe('feedPageHref', () => {
  it('omits the query on the first page', () => {
    expect(feedPageHref(1)).toBe('/feed')
    expect(feedPageHref(0)).toBe('/feed')
    expect(feedPageHref(2)).toEqual({ pathname: '/feed', query: { page: '2' } })
  })
})

describe('mergePublicFeed', () => {
  it('interleaves articles and notes newest first', () => {
    const items = mergePublicFeed(
      [doc('old-essay', '2026-01-01T00:00:00.000Z'), doc('new-essay', '2026-06-01T00:00:00.000Z')],
      [doc('mid-note', '2026-03-01T00:00:00.000Z')],
      1,
    )

    expect(items.map((item) => `${item.collection}:${item.slug}`)).toEqual([
      'articles:new-essay',
      'notes:mid-note',
      'articles:old-essay',
    ])
  })

  it('sorts a missing or unparseable date ahead of any real instant', () => {
    const items = mergePublicFeed(
      [doc('broken', 'not-a-date')],
      [doc('dated', '2026-06-01T00:00:00.000Z'), doc('undated', null)],
      1,
    )

    expect(items.map((item) => item.slug)).toEqual(['broken', 'undated', 'dated'])
  })

  it('breaks equal dates by slug, then collection, and keeps both copies of a shared slug', () => {
    const instant = '2026-06-01T00:00:00.000Z'
    const items = mergePublicFeed(
      [doc('same', instant), doc('b', instant)],
      [doc('same', instant), doc('a', instant)],
      1,
    )

    expect(items.map((item) => `${item.collection}:${item.slug}`)).toEqual([
      'notes:a',
      'articles:b',
      'articles:same',
      'notes:same',
    ])
  })

  it('returns only the requested page of the merged list', () => {
    const articles = Array.from({ length: FEED_PAGE_SIZE + 2 }, (_, index) =>
      doc(`essay-${index}`, new Date(Date.UTC(2026, 0, FEED_PAGE_SIZE + 2 - index)).toISOString()),
    )

    const page = mergePublicFeed(articles, [], 2)

    expect(page).toHaveLength(2)
    expect(page.map((item) => item.slug)).toEqual([
      `essay-${FEED_PAGE_SIZE}`,
      `essay-${FEED_PAGE_SIZE + 1}`,
    ])
  })
})
