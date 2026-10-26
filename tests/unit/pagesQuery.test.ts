/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import { publicContentWhere } from '@/access/publicContentWhere'
import {
  ABOUT_PAGE_SLUG,
  contactMailto,
  pageDetailFindArgs,
  publicPageForLocale,
  toPublicPage,
} from '@/content/pagesQuery'

const now = new Date('2026-10-26T12:00:00.000Z')

const body = { root: { type: 'root' } }

describe('pageDetailFindArgs', () => {
  it('loads one page slug with drafts closed and no session', () => {
    const args = pageDetailFindArgs({ locale: 'en', now, slug: ABOUT_PAGE_SLUG })

    expect(args).toEqual({
      collection: 'pages',
      depth: 1,
      draft: false,
      fallbackLocale: 'uk',
      limit: 1,
      locale: 'en',
      overrideAccess: false,
      pagination: false,
      select: {
        body: true,
        seo: {
          metaDescription: true,
          metaTitle: true,
        },
        slug: true,
        title: true,
      },
      where: {
        and: [{ slug: { equals: 'about' } }, publicContentWhere(now)],
      },
    })
    expect(args.collection).not.toBe('articles')
    expect(args.select).not.toHaveProperty('heroImage')
    expect(args.select).not.toHaveProperty('categories')
    expect(args.select).not.toHaveProperty('tags')
    expect(args).not.toHaveProperty('user')
    expect(args).not.toHaveProperty('req')
  })

  it('falls an unknown locale back to uk', () => {
    expect(pageDetailFindArgs({ locale: 'fr', slug: 'privacy' }).locale).toBe('uk')
  })
})

describe('toPublicPage', () => {
  it('keeps seo text and has no cover or taxonomy', () => {
    const page = toPublicPage({
      body,
      seo: { metaDescription: ' A line ', metaTitle: ' Author ' },
      title: 'About',
    })

    expect(page).toEqual({
      body,
      metaDescription: 'A line',
      metaTitle: 'Author',
      title: 'About',
    })
    expect(page).not.toHaveProperty('hero')
    expect(page).not.toHaveProperty('categories')
    expect(page).not.toHaveProperty('publishedAt')
  })

  it('drops blank seo and a document that cannot be read', () => {
    expect(
      toPublicPage({
        body,
        seo: { metaDescription: '   ', metaTitle: '' },
        title: 'About',
      }),
    ).toMatchObject({
      metaDescription: null,
      metaTitle: null,
      title: 'About',
    })

    expect(toPublicPage({ body, title: '' })).toBeNull()
    expect(toPublicPage({ body: null, title: 'No body' })).toBeNull()
    expect(toPublicPage({ body: 'plain', title: 'Plain' })).toBeNull()
  })
})

describe('publicPageForLocale', () => {
  it('keeps the fallback locale and rejects a slug this path does not own', () => {
    expect(publicPageForLocale({ body, slug: 'about', title: 'About' }, 'about')?.title).toBe(
      'About',
    )
    expect(publicPageForLocale({ body, slug: '', title: 'About' }, 'about')?.title).toBe('About')
    expect(publicPageForLocale({ body, slug: null, title: 'About' }, 'about')?.title).toBe('About')
    expect(publicPageForLocale({ body, slug: 'pro-avtora', title: 'About' }, 'about')).toBeNull()
  })
})

describe('contactMailto', () => {
  it('builds a mailto for one plain address', () => {
    expect(contactMailto('  author@example.com  ')).toBe('mailto:author@example.com')
    expect(contactMailto('author+blog@example.com')).toBe('mailto:author+blog@example.com')
  })

  it('drops empty and anything that is not a single address', () => {
    expect(contactMailto(undefined)).toBeNull()
    expect(contactMailto(null)).toBeNull()
    expect(contactMailto('')).toBeNull()
    expect(contactMailto('   ')).toBeNull()
    expect(contactMailto('author@example.com\nBcc:evil@example.com')).toBeNull()
    expect(contactMailto('author@example.com?subject=hi')).toBeNull()
    expect(contactMailto('mailto:author@example.com')).toBeNull()
    expect(contactMailto('not an email')).toBeNull()
    expect(contactMailto('author@example..com')).toBeNull()
  })
})
