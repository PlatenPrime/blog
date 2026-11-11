/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import { publicContentWhere } from '@/access/publicContentWhere'
import { ABOUT_PAGE_SLUG, PRIVACY_PAGE_SLUG } from '@/content/pagesQuery'
import {
  SITEMAP_DOC_LIMIT,
  SITEMAP_EXCLUDED_PATH_FRAGMENTS,
  SITEMAP_STATIC_PATHS,
  absolutePublicUrl,
  buildSitemapEntries,
  languageAlternatesForPath,
  mergeLocalizedSlugDocs,
  sitemapAboutFindArgs,
  sitemapContentFindArgs,
  sitemapPrivacyFindArgs,
  sitemapTaxonomyFindArgs,
  toSitemapSlugDoc,
} from '@/content/sitemapQuery'
import { TAXONOMY_INDEX_LIMIT } from '@/content/taxonomyQuery'
import { routing } from '@/i18n/routing'

const now = new Date('2026-11-09T12:00:00.000Z')
const origin = 'https://blog.example'

describe('sitemapContentFindArgs', () => {
  it('lists published content without a session and with drafts closed', () => {
    const args = sitemapContentFindArgs({ collection: 'articles', locale: 'fr', now })

    expect(args).toEqual({
      collection: 'articles',
      depth: 0,
      draft: false,
      fallbackLocale: 'uk',
      limit: SITEMAP_DOC_LIMIT,
      locale: 'uk',
      overrideAccess: false,
      pagination: false,
      select: { id: true, publishedAt: true, slug: true },
      sort: '-publishedAt',
      where: publicContentWhere(now),
    })
    expect(args).not.toHaveProperty('user')
    expect(args).not.toHaveProperty('req')
  })

  it('keeps notes under the same visibility contract', () => {
    const args = sitemapContentFindArgs({ collection: 'notes', locale: 'ru', now })

    expect(args.collection).toBe('notes')
    expect(args.locale).toBe('ru')
    expect(args.draft).toBe(false)
    expect(args.where).toEqual(publicContentWhere(now))
  })
})

describe('sitemapTaxonomyFindArgs', () => {
  it('reads every shelf without drafts or a session', () => {
    const args = sitemapTaxonomyFindArgs({ collection: 'categories', locale: 'en' })

    expect(args).toEqual({
      collection: 'categories',
      depth: 0,
      fallbackLocale: 'uk',
      limit: TAXONOMY_INDEX_LIMIT,
      locale: 'en',
      overrideAccess: false,
      pagination: false,
      select: { id: true, slug: true },
      sort: 'title',
    })
    expect(args).not.toHaveProperty('user')
    expect(args).not.toHaveProperty('req')
    expect(args).not.toHaveProperty('draft')
    expect(args).not.toHaveProperty('where')
  })
})

describe('sitemapAboutFindArgs', () => {
  it('checks the fixed about slug under publicContentWhere', () => {
    const args = sitemapAboutFindArgs({ now })

    expect(args.collection).toBe('pages')
    expect(args.draft).toBe(false)
    expect(args.overrideAccess).toBe(false)
    expect(args.locale).toBe('uk')
    expect(args.where).toEqual({
      and: [{ slug: { equals: ABOUT_PAGE_SLUG } }, publicContentWhere(now)],
    })
    expect(args).not.toHaveProperty('user')
    expect(args).not.toHaveProperty('req')
  })
})

describe('sitemapPrivacyFindArgs', () => {
  it('checks the fixed privacy slug under publicContentWhere', () => {
    const args = sitemapPrivacyFindArgs({ now })

    expect(args.collection).toBe('pages')
    expect(args.draft).toBe(false)
    expect(args.overrideAccess).toBe(false)
    expect(args.locale).toBe('uk')
    expect(args.where).toEqual({
      and: [{ slug: { equals: PRIVACY_PAGE_SLUG } }, publicContentWhere(now)],
    })
    expect(args).not.toHaveProperty('user')
    expect(args).not.toHaveProperty('req')
  })
})

describe('toSitemapSlugDoc / mergeLocalizedSlugDocs', () => {
  it('drops rows without id or slug', () => {
    expect(toSitemapSlugDoc({ id: 1, slug: '' })).toBeNull()
    expect(toSitemapSlugDoc({ id: null, slug: 'ok' })).toBeNull()
    expect(
      toSitemapSlugDoc({ id: 2, slug: 'ok', publishedAt: '2026-01-01T00:00:00.000Z' }),
    ).toEqual({
      id: 2,
      publishedAt: '2026-01-01T00:00:00.000Z',
      slug: 'ok',
    })
  })

  it('groups localized slugs by document id', () => {
    const byId = mergeLocalizedSlugDocs({
      uk: [{ id: 1, slug: 'vitannya', publishedAt: '2026-01-02T00:00:00.000Z' }],
      en: [{ id: 1, slug: 'hello', publishedAt: '2026-01-03T00:00:00.000Z' }],
      ru: [{ id: 2, slug: 'drugaya' }],
    })

    expect(byId.get(1)).toEqual({
      uk: { id: 1, slug: 'vitannya', publishedAt: '2026-01-02T00:00:00.000Z' },
      en: { id: 1, slug: 'hello', publishedAt: '2026-01-03T00:00:00.000Z' },
    })
    expect(byId.get(2)).toEqual({
      ru: { id: 2, slug: 'drugaya' },
    })
  })
})

describe('absolutePublicUrl / languageAlternatesForPath', () => {
  it('prefixes every locale and sets x-default to uk', () => {
    expect(absolutePublicUrl(origin, '/feed', 'ru')).toBe('https://blog.example/ru/feed')

    const languages = languageAlternatesForPath(origin, '/')
    expect(languages).toEqual({
      uk: 'https://blog.example/uk',
      ru: 'https://blog.example/ru',
      en: 'https://blog.example/en',
      'x-default': 'https://blog.example/uk',
    })
  })
})

describe('buildSitemapEntries', () => {
  it('emits every locale for static shells and skips auth/dev fragments', () => {
    const entries = buildSitemapEntries({
      aboutPublished: false,
      articlesByLocale: {},
      categoriesByLocale: {},
      notesByLocale: {},
      origin,
      privacyPublished: false,
      tagsByLocale: {},
    })

    const urls = entries.map((entry) => entry.url)

    for (const locale of routing.locales) {
      expect(urls).toContain(`${origin}/${locale}`)
      expect(urls).toContain(`${origin}/${locale}/feed`)
      expect(urls).toContain(`${origin}/${locale}/articles`)
      expect(urls).toContain(`${origin}/${locale}/notes`)
      expect(urls).toContain(`${origin}/${locale}/categories`)
      expect(urls).toContain(`${origin}/${locale}/tags`)
      expect(urls).toContain(`${origin}/${locale}/search`)
      expect(urls).not.toContain(`${origin}/${locale}/about`)
      expect(urls).not.toContain(`${origin}/${locale}/privacy`)
    }

    for (const fragment of SITEMAP_EXCLUDED_PATH_FRAGMENTS) {
      expect(urls.some((url) => url.includes(fragment))).toBe(false)
    }

    expect(SITEMAP_STATIC_PATHS).not.toContain('/about')
    expect(SITEMAP_STATIC_PATHS).not.toContain('/privacy')
  })

  it('adds about only when the CMS page is published', () => {
    const entries = buildSitemapEntries({
      aboutPublished: true,
      articlesByLocale: {},
      categoriesByLocale: {},
      notesByLocale: {},
      origin,
      privacyPublished: false,
      tagsByLocale: {},
    })

    const about = entries.find((entry) => entry.url === `${origin}/uk/about`)
    expect(about).toBeDefined()
    expect(about?.alternates?.languages).toMatchObject({
      uk: `${origin}/uk/about`,
      ru: `${origin}/ru/about`,
      en: `${origin}/en/about`,
      'x-default': `${origin}/uk/about`,
    })
    expect(entries.some((entry) => entry.url === `${origin}/uk/privacy`)).toBe(false)
  })

  it('adds privacy only when the CMS page is published', () => {
    const entries = buildSitemapEntries({
      aboutPublished: false,
      articlesByLocale: {},
      categoriesByLocale: {},
      notesByLocale: {},
      origin,
      privacyPublished: true,
      tagsByLocale: {},
    })

    const privacy = entries.find((entry) => entry.url === `${origin}/uk/privacy`)
    expect(privacy).toBeDefined()
    expect(privacy?.alternates?.languages).toMatchObject({
      uk: `${origin}/uk/privacy`,
      ru: `${origin}/ru/privacy`,
      en: `${origin}/en/privacy`,
      'x-default': `${origin}/uk/privacy`,
    })
  })

  it('emits published article URLs with localized slugs and lastModified', () => {
    const entries = buildSitemapEntries({
      aboutPublished: false,
      articlesByLocale: {
        uk: [{ id: 10, slug: 'persha', publishedAt: '2026-02-01T00:00:00.000Z' }],
        en: [{ id: 10, slug: 'first', publishedAt: '2026-02-02T00:00:00.000Z' }],
      },
      categoriesByLocale: {
        uk: [{ id: 3, slug: 'zhittya' }],
      },
      notesByLocale: {},
      origin,
      privacyPublished: false,
      tagsByLocale: {},
    })

    const ukArticle = entries.find((entry) => entry.url === `${origin}/uk/articles/persha`)
    const enArticle = entries.find((entry) => entry.url === `${origin}/en/articles/first`)
    const draftAbsent = entries.find((entry) => entry.url.includes('draft-secret'))

    expect(ukArticle).toBeDefined()
    expect(enArticle).toBeDefined()
    expect(ukArticle?.alternates?.languages).toMatchObject({
      uk: `${origin}/uk/articles/persha`,
      en: `${origin}/en/articles/first`,
      'x-default': `${origin}/uk/articles/persha`,
    })
    expect(ukArticle?.lastModified).toEqual(new Date('2026-02-02T00:00:00.000Z'))
    expect(entries.some((entry) => entry.url === `${origin}/uk/categories/zhittya`)).toBe(true)
    expect(draftAbsent).toBeUndefined()
  })

  it('never invents draft URLs from the builder input', () => {
    const entries = buildSitemapEntries({
      aboutPublished: false,
      articlesByLocale: {
        uk: [{ id: 1, slug: 'published-only' }],
      },
      categoriesByLocale: {},
      notesByLocale: {},
      origin,
      privacyPublished: false,
      tagsByLocale: {},
    })

    const articleUrls = entries
      .map((entry) => entry.url)
      .filter((url) => url.includes('/articles/'))

    expect(articleUrls).toEqual([`${origin}/uk/articles/published-only`])
  })
})
