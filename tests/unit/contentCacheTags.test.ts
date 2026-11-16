/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import {
  CONTENT_CACHE_TAGS,
  contentEntityTag,
  detailCacheTags,
  listCacheTags,
  mixedContentCacheTags,
  revalidateTagsForDocument,
} from '@/cache/contentTags'

describe('contentEntityTag', () => {
  it('uses singular prefixes', () => {
    expect(contentEntityTag('articles', 12)).toBe('article:12')
    expect(contentEntityTag('notes', '3')).toBe('note:3')
    expect(contentEntityTag('pages', 1)).toBe('page:1')
    expect(contentEntityTag('categories', 7)).toBe('category:7')
    expect(contentEntityTag('tags', 9)).toBe('tag:9')
  })
})

describe('revalidateTagsForDocument', () => {
  it('busts collection, entity, home, and feed for articles', () => {
    expect(revalidateTagsForDocument('articles', 5)).toEqual([
      CONTENT_CACHE_TAGS.articles,
      'article:5',
      CONTENT_CACHE_TAGS.home,
      CONTENT_CACHE_TAGS.feed,
    ])
  })

  it('busts the same aggregate tags for taxonomy terms', () => {
    expect(revalidateTagsForDocument('categories', 2)).toEqual([
      CONTENT_CACHE_TAGS.categories,
      'category:2',
      CONTENT_CACHE_TAGS.home,
      CONTENT_CACHE_TAGS.feed,
    ])
  })
})

describe('listCacheTags / detailCacheTags / mixedContentCacheTags', () => {
  it('lists articles with home and feed', () => {
    expect(listCacheTags('articles')).toEqual([
      CONTENT_CACHE_TAGS.articles,
      CONTENT_CACHE_TAGS.home,
      CONTENT_CACHE_TAGS.feed,
    ])
  })

  it('lists pages without feed', () => {
    expect(listCacheTags('pages')).toEqual([CONTENT_CACHE_TAGS.pages, CONTENT_CACHE_TAGS.home])
  })

  it('details include entity when id is known', () => {
    expect(detailCacheTags('notes', 4)).toEqual([CONTENT_CACHE_TAGS.notes, 'note:4'])
    expect(detailCacheTags('notes')).toEqual([CONTENT_CACHE_TAGS.notes])
  })

  it('mixed content always includes articles and notes', () => {
    expect(mixedContentCacheTags('categories')).toEqual(
      expect.arrayContaining([
        CONTENT_CACHE_TAGS.articles,
        CONTENT_CACHE_TAGS.notes,
        CONTENT_CACHE_TAGS.categories,
        CONTENT_CACHE_TAGS.home,
        CONTENT_CACHE_TAGS.feed,
      ]),
    )
  })
})
