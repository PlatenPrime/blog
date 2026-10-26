/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import { publicContentWhere } from '@/access/publicContentWhere'
import {
  ARTICLES_PAGE_SIZE,
  articlesCountArgs,
  articlesDetailFindArgs,
  articlesListFindArgs,
  articlesPageHref,
  resolveArticlesPage,
  toPublicArticle,
} from '@/content/articlesQuery'

const now = new Date('2026-10-26T12:00:00.000Z')

const body = { root: { type: 'root' } }

describe('articlesCountArgs', () => {
  it('counts published articles and never the session user', () => {
    const args = articlesCountArgs({ locale: 'fr', now })

    expect(args).toEqual({
      collection: 'articles',
      locale: 'uk',
      overrideAccess: false,
      where: publicContentWhere(now),
    })
    expect(args).not.toHaveProperty('user')
    expect(args).not.toHaveProperty('req')
    expect(args).not.toHaveProperty('draft')
  })
})

describe('articlesListFindArgs', () => {
  it('asks for one SQL page under the public visibility contract', () => {
    const args = articlesListFindArgs({ locale: 'ru', now, page: 2 })

    expect(args).toEqual({
      collection: 'articles',
      depth: 0,
      draft: false,
      fallbackLocale: 'uk',
      limit: ARTICLES_PAGE_SIZE,
      locale: 'ru',
      overrideAccess: false,
      page: 2,
      pagination: true,
      select: {
        publishedAt: true,
        slug: true,
        title: true,
      },
      sort: '-publishedAt',
      where: publicContentWhere(now),
    })
    expect(args).not.toHaveProperty('user')
    expect(args).not.toHaveProperty('req')
  })
})

describe('articlesDetailFindArgs', () => {
  it('loads one slug with the cover populated and drafts closed', () => {
    const args = articlesDetailFindArgs({ locale: 'en', now, slug: 'first-essay' })

    expect(args.collection).toBe('articles')
    expect(args.depth).toBe(1)
    expect(args.draft).toBe(false)
    expect(args.limit).toBe(1)
    expect(args.locale).toBe('en')
    expect(args.overrideAccess).toBe(false)
    expect(args.pagination).toBe(false)
    expect(args.where).toEqual({
      and: [{ slug: { equals: 'first-essay' } }, publicContentWhere(now)],
    })
    expect(args).not.toHaveProperty('user')
    expect(args).not.toHaveProperty('req')
  })
})

describe('resolveArticlesPage', () => {
  it('sends page 1 and garbage to the canonical url', () => {
    expect(resolveArticlesPage(undefined, 25)).toEqual({ kind: 'render', page: 1 })
    expect(resolveArticlesPage('1', 25)).toEqual({ kind: 'redirect', page: null })
    expect(resolveArticlesPage('0', 25)).toEqual({ kind: 'redirect', page: null })
    expect(resolveArticlesPage('nope', 25)).toEqual({ kind: 'redirect', page: null })
  })

  it('clamps a page past the end to the last page', () => {
    expect(resolveArticlesPage('2', 25)).toEqual({ kind: 'render', page: 2 })
    expect(resolveArticlesPage('4', 25)).toEqual({ kind: 'redirect', page: 3 })
  })
})

describe('articlesPageHref', () => {
  it('omits the query on the first page', () => {
    expect(articlesPageHref(1)).toBe('/articles')
    expect(articlesPageHref(0)).toBe('/articles')
    expect(articlesPageHref(2)).toEqual({ pathname: '/articles', query: { page: '2' } })
  })
})

describe('toPublicArticle', () => {
  it('keeps cover, taxonomy links, and seo text', () => {
    const article = toPublicArticle({
      body,
      categories: [{ slug: 'notes', title: 'Notes' }, 4, { title: '' }, { title: 'No slug' }, null],
      heroImage: { alt: 'Cover', height: 600, url: '/api/media/file/cover.webp', width: 1200 },
      id: 12,
      publishedAt: '2026-06-01T00:00:00.000Z',
      seo: { metaDescription: ' A lead ', metaTitle: ' Essay ' },
      tags: [9, { slug: '', title: 'Payload' }, { slug: 'live', title: 'Live' }],
      title: 'First essay',
    })

    expect(article).toEqual({
      body,
      categories: [{ slug: 'notes', title: 'Notes' }],
      hero: { alt: 'Cover', height: 600, url: '/api/media/file/cover.webp', width: 1200 },
      id: 12,
      metaDescription: 'A lead',
      metaTitle: 'Essay',
      publishedAt: '2026-06-01T00:00:00.000Z',
      tags: [{ slug: 'live', title: 'Live' }],
      title: 'First essay',
    })
  })

  it('drops a bare upload id, blank seo, and a document that cannot be read', () => {
    expect(
      toPublicArticle({
        body,
        heroImage: 3,
        id: 8,
        seo: { metaDescription: '   ', metaTitle: '' },
        title: 'Untitled cover',
      }),
    ).toMatchObject({
      hero: null,
      metaDescription: null,
      metaTitle: null,
      title: 'Untitled cover',
    })

    expect(toPublicArticle({ body, title: 'Missing id' })).toBeNull()
    expect(toPublicArticle({ body, title: '' })).toBeNull()
    expect(toPublicArticle({ body: null, title: 'No body' })).toBeNull()
    expect(toPublicArticle({ body: 'plain', title: 'Plain' })).toBeNull()
  })
})
