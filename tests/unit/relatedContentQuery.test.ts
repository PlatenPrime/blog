/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import { publicContentWhere } from '@/access/publicContentWhere'
import { latestPublicFindArgs } from '@/content/latestPublicQuery'
import {
  RELATED_LIMIT,
  mergeRelatedContent,
  relatedContentWhere,
  relatedFindArgs,
} from '@/content/relatedContentQuery'
import { taxonomyIds } from '@/content/taxonomyLinks'

const now = new Date('2026-10-26T12:00:00.000Z')

describe('taxonomyIds', () => {
  it('keeps bare and populated ids, and drops duplicates and junk', () => {
    expect(
      taxonomyIds([
        4,
        { id: 2, slug: 'city', title: 'City' },
        4,
        { id: 2, slug: 'city', title: 'City' },
        { slug: 'no-id', title: 'No id' },
        null,
        { id: null, slug: 'null-id', title: 'Null' },
      ]),
    ).toEqual([4, 2])
    expect(taxonomyIds(undefined)).toEqual([])
    expect(taxonomyIds([])).toEqual([])
  })
})

describe('relatedContentWhere', () => {
  it('returns null when there is no taxonomy to match', () => {
    expect(relatedContentWhere({ categoryIds: [], tagIds: [], now })).toBeNull()
    expect(relatedContentWhere({ categoryIds: [], excludeId: 1, tagIds: [], now })).toBeNull()
  })

  it('keeps public visibility, excludes the current id, and ors shared shelves', () => {
    expect(
      relatedContentWhere({
        categoryIds: [2, 2],
        excludeId: 12,
        now,
        tagIds: [5],
      }),
    ).toEqual({
      and: [
        publicContentWhere(now),
        { id: { not_equals: 12 } },
        {
          or: [{ categories: { in: [2] } }, { tags: { in: [5] } }],
        },
      ],
    })
  })

  it('uses a single taxonomy clause when only one side has ids', () => {
    expect(relatedContentWhere({ categoryIds: [7], now, tagIds: [] })).toEqual({
      and: [publicContentWhere(now), { categories: { in: [7] } }],
    })
    expect(relatedContentWhere({ categoryIds: [], now, tagIds: [3] })).toEqual({
      and: [publicContentWhere(now), { tags: { in: [3] } }],
    })
  })

  it('omits exclusion when excludeId is unset', () => {
    expect(relatedContentWhere({ categoryIds: [1], now, tagIds: [] })).toEqual({
      and: [publicContentWhere(now), { categories: { in: [1] } }],
    })
  })
})

describe('relatedFindArgs', () => {
  it('excludes the current id only in the same collection', () => {
    const articleArgs = relatedFindArgs({
      categoryIds: [2],
      collection: 'articles',
      excludeCollection: 'articles',
      excludeId: 12,
      locale: 'uk',
      now,
      tagIds: [5],
    })
    const noteArgs = relatedFindArgs({
      categoryIds: [2],
      collection: 'notes',
      excludeCollection: 'articles',
      excludeId: 12,
      locale: 'uk',
      now,
      tagIds: [5],
    })

    expect(articleArgs).toEqual({
      ...latestPublicFindArgs({
        collection: 'articles',
        limit: RELATED_LIMIT,
        locale: 'uk',
        now,
      }),
      where: relatedContentWhere({
        categoryIds: [2],
        excludeId: 12,
        now,
        tagIds: [5],
      }),
    })
    expect(noteArgs).toEqual({
      ...latestPublicFindArgs({
        collection: 'notes',
        limit: RELATED_LIMIT,
        locale: 'uk',
        now,
      }),
      where: relatedContentWhere({
        categoryIds: [2],
        now,
        tagIds: [5],
      }),
    })
    expect(articleArgs).not.toHaveProperty('user')
    expect(articleArgs).not.toHaveProperty('req')
    expect(articleArgs?.draft).toBe(false)
    expect(articleArgs?.overrideAccess).toBe(false)
  })

  it('returns null when taxonomy is empty', () => {
    expect(
      relatedFindArgs({
        categoryIds: [],
        collection: 'articles',
        excludeCollection: 'articles',
        excludeId: 1,
        locale: 'en',
        tagIds: [],
      }),
    ).toBeNull()
  })
})

describe('mergeRelatedContent', () => {
  it('sorts like the feed and keeps at most RELATED_LIMIT', () => {
    expect(
      mergeRelatedContent(
        [
          { publishedAt: '2026-01-02T00:00:00.000Z', slug: 'a2', title: 'A2' },
          { publishedAt: '2026-01-04T00:00:00.000Z', slug: 'a4', title: 'A4' },
          { publishedAt: null, slug: 'a-null', title: 'A null' },
        ],
        [
          { publishedAt: '2026-01-03T00:00:00.000Z', slug: 'n3', title: 'N3' },
          { publishedAt: '2026-01-05T00:00:00.000Z', slug: 'n5', title: 'N5' },
        ],
      ),
    ).toEqual([
      {
        collection: 'articles',
        publishedAt: null,
        slug: 'a-null',
        title: 'A null',
      },
      {
        collection: 'notes',
        publishedAt: '2026-01-05T00:00:00.000Z',
        slug: 'n5',
        title: 'N5',
      },
      {
        collection: 'articles',
        publishedAt: '2026-01-04T00:00:00.000Z',
        slug: 'a4',
        title: 'A4',
      },
    ])
  })
})
