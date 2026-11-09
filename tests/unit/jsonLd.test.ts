/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import {
  buildArticleJsonLd,
  buildLocaleShellJsonLd,
  buildPersonJsonLd,
  buildWebsiteJsonLd,
  JSON_LD_CONTEXT,
  personJsonLdId,
  resolveArticleImageUrl,
  serializeJsonLd,
  websiteJsonLdId,
} from '@/content/jsonLd'

const origin = 'https://blog.example'

describe('serializeJsonLd', () => {
  it('round-trips through JSON.parse and escapes raw <', () => {
    const payload = serializeJsonLd({
      '@context': JSON_LD_CONTEXT,
      '@type': 'WebSite',
      name: 'A <script> name',
    })

    expect(payload).toContain('\\u003c')
    expect(payload).not.toContain('<script>')

    const parsed = JSON.parse(payload) as Record<string, unknown>
    expect(parsed['@context']).toBe(JSON_LD_CONTEXT)
    expect(parsed['@type']).toBe('WebSite')
    expect(parsed.name).toBe('A <script> name')
  })
})

describe('buildWebsiteJsonLd / buildPersonJsonLd', () => {
  it('emits absolute locale-aware urls for uk / ru / en', () => {
    for (const locale of ['uk', 'ru', 'en'] as const) {
      const website = buildWebsiteJsonLd({
        description: 'Blog',
        locale,
        name: 'PlatenPrime',
        origin,
      })
      const person = buildPersonJsonLd({
        contactEmail: 'hello@example.com',
        locale,
        name: 'PlatenPrime',
        origin,
      })

      expect(website['@type']).toBe('WebSite')
      expect(website.url).toBe(`${origin}/${locale}`)
      expect(website.inLanguage).toBe(locale)
      expect(website['@id']).toBe(websiteJsonLdId(origin))
      expect(website.publisher).toEqual({ '@id': personJsonLdId(origin) })

      expect(person['@type']).toBe('Person')
      expect(person.url).toBe(`${origin}/${locale}/about`)
      expect(person.email).toBe('hello@example.com')
      expect(person['@id']).toBe(personJsonLdId(origin))
    }
  })

  it('omits Person email when CONTACT_EMAIL is junk', () => {
    const person = buildPersonJsonLd({
      contactEmail: 'not-an-email',
      locale: 'uk',
      name: 'PlatenPrime',
      origin,
    })

    expect(person.email).toBeUndefined()
  })
})

describe('buildLocaleShellJsonLd', () => {
  it('smoke-parses a @graph with WebSite and Person under one context', () => {
    const graph = buildLocaleShellJsonLd({
      contactEmail: 'hello@example.com',
      description: 'Personal blog',
      locale: 'ru',
      name: 'PlatenPrime',
      origin: `${origin}/`,
    })

    const parsed = JSON.parse(serializeJsonLd(graph)) as {
      '@context': string
      '@graph': Array<Record<string, unknown>>
    }

    expect(parsed['@context']).toBe(JSON_LD_CONTEXT)
    expect(parsed['@graph']).toHaveLength(2)
    expect(parsed['@graph'][0]?.['@type']).toBe('WebSite')
    expect(parsed['@graph'][0]?.url).toBe(`${origin}/ru`)
    expect(parsed['@graph'][1]?.['@type']).toBe('Person')
    expect(parsed['@graph'][0]?.['@context']).toBeUndefined()
    expect(parsed['@graph'][1]?.['@context']).toBeUndefined()
  })
})

describe('buildArticleJsonLd', () => {
  it('links author and website by stable @id and uses locale article url', () => {
    const article = buildArticleJsonLd({
      description: 'Meta',
      heroUrl: '/api/media/file/hero.webp',
      locale: 'en',
      ogImageUrl: '/api/media/file/og.webp',
      origin,
      pathname: '/articles/hello-world',
      publishedAt: '2026-03-01T10:00:00.000Z',
      title: 'Hello',
    })

    const parsed = JSON.parse(serializeJsonLd(article)) as Record<string, unknown>

    expect(parsed['@context']).toBe(JSON_LD_CONTEXT)
    expect(parsed['@type']).toBe('Article')
    expect(parsed.headline).toBe('Hello')
    expect(parsed.description).toBe('Meta')
    expect(parsed.datePublished).toBe('2026-03-01T10:00:00.000Z')
    expect(parsed.url).toBe(`${origin}/en/articles/hello-world`)
    expect(parsed.inLanguage).toBe('en')
    expect(parsed.author).toEqual({ '@id': personJsonLdId(origin) })
    expect(parsed.isPartOf).toEqual({ '@id': websiteJsonLdId(origin) })
    expect(parsed.image).toBe(`${origin}/api/media/file/og.webp`)
    expect(parsed.mainEntityOfPage).toEqual({
      '@id': `${origin}/en/articles/hello-world`,
      '@type': 'WebPage',
    })
  })

  it('falls back image to opengraph-image when media is absent', () => {
    const note = buildArticleJsonLd({
      locale: 'uk',
      origin,
      pathname: '/notes/quick-thought',
      title: 'Quick',
    })

    expect(note.image).toBe(`${origin}/uk/notes/quick-thought/opengraph-image`)
    expect(note.description).toBeUndefined()
    expect(note.datePublished).toBeUndefined()
  })
})

describe('resolveArticleImageUrl', () => {
  it('prefers seo.ogImage, then hero, then opengraph-image', () => {
    expect(
      resolveArticleImageUrl({
        heroUrl: '/api/media/file/hero.webp',
        ogImageUrl: '/api/media/file/og.webp',
        origin,
        pageUrl: `${origin}/uk/articles/a`,
      }),
    ).toBe(`${origin}/api/media/file/og.webp`)

    expect(
      resolveArticleImageUrl({
        heroUrl: '/api/media/file/hero.webp',
        ogImageUrl: null,
        origin,
        pageUrl: `${origin}/uk/articles/a`,
      }),
    ).toBe(`${origin}/api/media/file/hero.webp`)

    expect(
      resolveArticleImageUrl({
        heroUrl: null,
        ogImageUrl: null,
        origin,
        pageUrl: `${origin}/ru/notes/b`,
      }),
    ).toBe(`${origin}/ru/notes/b/opengraph-image`)
  })
})
