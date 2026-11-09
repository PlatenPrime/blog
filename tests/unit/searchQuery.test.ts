/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import { publicContentWhere } from '@/access/publicContentWhere'
import {
  SEARCH_PAGE_SIZE,
  SEARCH_QUERY_MAX_LENGTH,
  mergePublicSearch,
  normalizeSearchQuery,
  readSearchPageParam,
  readSearchQueryParam,
  resolveSearchPage,
  searchContentWhere,
  searchCountArgs,
  searchEmptyHref,
  searchFindArgs,
  searchPageHref,
} from '@/content/searchQuery'
import { applySearchTextFromBody } from '@/hooks/setSearchTextFromBody'
import type { LatestPublicDoc } from '@/content/latestPublicQuery'

const now = new Date('2026-11-09T12:00:00.000Z')

function doc(slug: string, publishedAt: string | null): LatestPublicDoc {
  return { publishedAt, slug, title: slug }
}

describe('normalizeSearchQuery', () => {
  it('returns null for missing, empty, and whitespace-only input', () => {
    expect(normalizeSearchQuery(undefined)).toBeNull()
    expect(normalizeSearchQuery('')).toBeNull()
    expect(normalizeSearchQuery('   \t  ')).toBeNull()
    expect(normalizeSearchQuery(['', 'kept'])).toBeNull()
  })

  it('trims, collapses spaces, keeps the first of a repeated param, and caps length', () => {
    expect(normalizeSearchQuery('  hello   world  ')).toBe('hello world')
    expect(normalizeSearchQuery(['first', 'second'])).toBe('first')
    expect(normalizeSearchQuery('a'.repeat(SEARCH_QUERY_MAX_LENGTH + 20))).toBe(
      'a'.repeat(SEARCH_QUERY_MAX_LENGTH),
    )
  })
})

describe('searchContentWhere', () => {
  it('ands public visibility with title and searchText like', () => {
    expect(searchContentWhere('payload', now)).toEqual({
      and: [
        publicContentWhere(now),
        {
          or: [{ title: { like: 'payload' } }, { searchText: { like: 'payload' } }],
        },
      ],
    })
  })
})

describe('searchFindArgs / searchCountArgs', () => {
  it('keeps the public find contract and widens the limit to the page window', () => {
    const args = searchFindArgs({
      collection: 'articles',
      locale: 'ru',
      now,
      page: 2,
      q: 'cms',
    })

    expect(args.draft).toBe(false)
    expect(args.overrideAccess).toBe(false)
    expect(args.fallbackLocale).toBe('uk')
    expect(args.locale).toBe('ru')
    expect(args.limit).toBe(2 * SEARCH_PAGE_SIZE)
    expect(args.where).toEqual(searchContentWhere('cms', now))
    expect(args).not.toHaveProperty('user')
    expect(args).not.toHaveProperty('req')
  })

  it('counts with the same where and never the session user', () => {
    const args = searchCountArgs({ collection: 'notes', locale: 'fr', now, q: 'note' })

    expect(args).toEqual({
      collection: 'notes',
      locale: 'uk',
      overrideAccess: false,
      where: searchContentWhere('note', now),
    })
    expect(args).not.toHaveProperty('user')
    expect(args).not.toHaveProperty('req')
    expect(args).not.toHaveProperty('draft')
  })
})

describe('resolveSearchPage / href helpers', () => {
  it('reads the first q and page values', () => {
    expect(readSearchQueryParam(undefined)).toBeUndefined()
    expect(readSearchQueryParam(['a', 'b'])).toBe('a')
    expect(readSearchPageParam(['2', '9'])).toBe('2')
  })

  it('resolves pages like other numbered lists', () => {
    expect(resolveSearchPage(undefined, 25)).toEqual({ kind: 'render', page: 1 })
    expect(resolveSearchPage('1', 25)).toEqual({ kind: 'redirect', page: null })
    expect(resolveSearchPage('0', 25)).toEqual({ kind: 'redirect', page: null })
    expect(resolveSearchPage('4', 25)).toEqual({ kind: 'redirect', page: 3 })
  })

  it('keeps q on every search page href', () => {
    expect(searchEmptyHref()).toBe('/search')
    expect(searchPageHref('hello', 1)).toEqual({ pathname: '/search', query: { q: 'hello' } })
    expect(searchPageHref('hello', 2)).toEqual({
      pathname: '/search',
      query: { q: 'hello', page: '2' },
    })
  })
})

describe('mergePublicSearch', () => {
  it('reuses the feed merge window', () => {
    const items = mergePublicSearch(
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
})

describe('applySearchTextFromBody', () => {
  it('derives plaintext when body is present and leaves other writes alone', () => {
    const withBody = applySearchTextFromBody({
      title: 'Hello',
      body: {
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              version: 1,
              children: [{ type: 'text', text: 'Searchable body', version: 1 }],
            },
          ],
          direction: null,
          format: '',
          indent: 0,
          version: 1,
        },
      },
    })

    expect(withBody.searchText).toContain('Searchable body')

    const withoutBody = applySearchTextFromBody({ title: 'Only title', searchText: 'keep' })
    expect(withoutBody.searchText).toBe('keep')
  })
})
