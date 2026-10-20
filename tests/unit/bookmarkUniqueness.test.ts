/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import {
  buildBookmarkDuplicateWhere,
  normalizeBookmarkContent,
} from '@/collections/bookmarkUniqueness'

describe('normalizeBookmarkContent', () => {
  it('normalizes a bare content id', () => {
    expect(normalizeBookmarkContent({ relationTo: 'articles', value: 10 })).toEqual({
      relationTo: 'articles',
      value: 10,
    })
  })

  it('unwraps a populated content document', () => {
    expect(
      normalizeBookmarkContent({
        relationTo: 'notes',
        value: { id: 'abc', title: 'x' },
      }),
    ).toEqual({ relationTo: 'notes', value: 'abc' })
  })

  it('returns null for missing or incomplete content', () => {
    expect(normalizeBookmarkContent(null)).toBeNull()
    expect(normalizeBookmarkContent(undefined)).toBeNull()
    expect(normalizeBookmarkContent('articles')).toBeNull()
    expect(normalizeBookmarkContent({ relationTo: 'pages', value: 1 })).toBeNull()
    expect(normalizeBookmarkContent({ relationTo: 'articles' })).toBeNull()
    expect(normalizeBookmarkContent({ relationTo: 'articles', value: '' })).toBeNull()
    expect(normalizeBookmarkContent({ relationTo: 'articles', value: null })).toBeNull()
  })
})

describe('buildBookmarkDuplicateWhere', () => {
  it('builds a where clause for user + polymorphic content', () => {
    expect(
      buildBookmarkDuplicateWhere({
        userId: 5,
        content: { relationTo: 'articles', value: 10 },
      }),
    ).toEqual({
      and: [
        { user: { equals: 5 } },
        { 'content.relationTo': { equals: 'articles' } },
        { 'content.value': { equals: 10 } },
      ],
    })
  })

  it('adds excludeId on update', () => {
    expect(
      buildBookmarkDuplicateWhere({
        userId: 5,
        content: { relationTo: 'notes', value: 'n1' },
        excludeId: 99,
      }),
    ).toEqual({
      and: [
        { user: { equals: 5 } },
        { 'content.relationTo': { equals: 'notes' } },
        { 'content.value': { equals: 'n1' } },
        { id: { not_equals: 99 } },
      ],
    })
  })
})
