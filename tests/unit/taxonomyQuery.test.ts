/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import { publicContentWhere } from '@/access/publicContentWhere'
import { FEED_PAGE_SIZE } from '@/content/feedQuery'
import { latestPublicFindArgs } from '@/content/latestPublicQuery'
import { taxonomyLinks } from '@/content/taxonomyLinks'
import {
  TAXONOMY_INDEX_LIMIT,
  taxonomyContentWhere,
  taxonomyFeedCountArgs,
  taxonomyFeedFindArgs,
  taxonomyIndexFindArgs,
  taxonomyTermFindArgs,
  taxonomyTermHref,
  toTaxonomyTerm,
} from '@/content/taxonomyQuery'

const now = new Date('2026-10-26T12:00:00.000Z')

describe('taxonomyContentWhere', () => {
  it('keeps public visibility and narrows articles and notes to one shelf', () => {
    expect(taxonomyContentWhere({ id: 7, now, taxonomy: 'categories' })).toEqual({
      and: [publicContentWhere(now), { categories: { in: [7] } }],
    })
    expect(taxonomyContentWhere({ id: 3, now, taxonomy: 'tags' })).toEqual({
      and: [publicContentWhere(now), { tags: { in: [3] } }],
    })
  })
})

describe('taxonomyIndexFindArgs', () => {
  it('lists shelves by title and never the session user', () => {
    const args = taxonomyIndexFindArgs({ collection: 'categories', locale: 'fr' })

    expect(args).toEqual({
      collection: 'categories',
      depth: 0,
      fallbackLocale: 'uk',
      limit: TAXONOMY_INDEX_LIMIT,
      locale: 'uk',
      overrideAccess: false,
      pagination: false,
      select: { id: true, slug: true, title: true },
      sort: 'title',
    })
    expect(args).not.toHaveProperty('user')
    expect(args).not.toHaveProperty('req')
    expect(args).not.toHaveProperty('where')
  })
})

describe('taxonomyTermFindArgs', () => {
  it('loads one localized slug with the base locale as fallback', () => {
    const args = taxonomyTermFindArgs({ collection: 'tags', locale: 'en', slug: 'night' })

    expect(args).toEqual({
      collection: 'tags',
      depth: 0,
      fallbackLocale: 'uk',
      limit: 1,
      locale: 'en',
      overrideAccess: false,
      pagination: false,
      select: { id: true, slug: true, title: true },
      where: { slug: { equals: 'night' } },
    })
    expect(args).not.toHaveProperty('user')
    expect(args).not.toHaveProperty('req')
  })
})

describe('taxonomyFeedCountArgs', () => {
  it('counts with the shelf where and never the session user', () => {
    const args = taxonomyFeedCountArgs({
      collection: 'articles',
      id: 7,
      locale: 'fr',
      now,
      taxonomy: 'categories',
    })

    expect(args).toEqual({
      collection: 'articles',
      locale: 'uk',
      overrideAccess: false,
      where: taxonomyContentWhere({ id: 7, now, taxonomy: 'categories' }),
    })
    expect(args).not.toHaveProperty('user')
    expect(args).not.toHaveProperty('req')
    expect(args).not.toHaveProperty('draft')
  })
})

describe('taxonomyFeedFindArgs', () => {
  it('reuses the feed window and only narrows where', () => {
    const args = taxonomyFeedFindArgs({
      collection: 'notes',
      id: 4,
      locale: 'ru',
      now,
      page: 2,
      taxonomy: 'tags',
    })

    expect(args).toEqual({
      ...latestPublicFindArgs({
        collection: 'notes',
        limit: 2 * FEED_PAGE_SIZE,
        locale: 'ru',
        now,
      }),
      where: taxonomyContentWhere({ id: 4, now, taxonomy: 'tags' }),
    })
    expect(args.draft).toBe(false)
    expect(args.overrideAccess).toBe(false)
    expect(args).not.toHaveProperty('user')
    expect(args).not.toHaveProperty('req')
  })
})

describe('taxonomyTermHref', () => {
  it('omits the query on the first page and keeps the shelf slug', () => {
    expect(taxonomyTermHref('categories', 'city', 1)).toBe('/categories/city')
    expect(taxonomyTermHref('categories', 'city', 0)).toBe('/categories/city')
    expect(taxonomyTermHref('tags', 'night', 2)).toEqual({
      pathname: '/tags/night',
      query: { page: '2' },
    })
  })
})

describe('toTaxonomyTerm', () => {
  it('keeps a shelf that has an id, a title, and a slug', () => {
    expect(toTaxonomyTerm({ id: 2, slug: 'city', title: 'City' })).toEqual({
      id: 2,
      slug: 'city',
      title: 'City',
    })
  })

  it('drops a blank shelf', () => {
    expect(toTaxonomyTerm(undefined)).toBeNull()
    expect(toTaxonomyTerm({ id: 2, slug: '', title: 'City' })).toBeNull()
    expect(toTaxonomyTerm({ id: 2, slug: 'city', title: '' })).toBeNull()
    expect(toTaxonomyTerm({ slug: 'city', title: 'City' })).toBeNull()
  })
})

describe('taxonomyLinks', () => {
  it('keeps populated links and drops a name that cannot be addressed', () => {
    expect(
      taxonomyLinks([
        { slug: 'city', title: 'City' },
        4,
        { title: 'No slug' },
        { slug: '', title: 'Empty slug' },
        { slug: 'blank', title: '' },
        null,
      ]),
    ).toEqual([{ slug: 'city', title: 'City' }])
  })
})
