/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import { publicContentWhere } from '@/access/publicContentWhere'
import {
  RSS_EXCERPT_MAX,
  RSS_ITEM_LIMIT,
  absoluteRssFeedUrl,
  absoluteRssItemUrl,
  buildRssXml,
  escapeXml,
  mergeRssItems,
  rssContentFindArgs,
  rssExcerpt,
  rssFeedPath,
  toRssDoc,
  toRssItems,
  toRssPubDate,
  type RssItem,
} from '@/content/rssQuery'

const now = new Date('2026-11-09T12:00:00.000Z')
const origin = 'https://blog.example'

describe('rssContentFindArgs', () => {
  it('lists published content without a session and with drafts closed', () => {
    const args = rssContentFindArgs({ collection: 'articles', locale: 'fr', now })

    expect(args).toEqual({
      collection: 'articles',
      depth: 0,
      draft: false,
      fallbackLocale: 'uk',
      limit: RSS_ITEM_LIMIT,
      locale: 'uk',
      overrideAccess: false,
      pagination: false,
      select: {
        publishedAt: true,
        searchText: true,
        seo: { metaDescription: true },
        slug: true,
        title: true,
      },
      sort: '-publishedAt',
      where: publicContentWhere(now),
    })
    expect(args).not.toHaveProperty('user')
    expect(args).not.toHaveProperty('req')
  })

  it('keeps notes under the same visibility contract', () => {
    const args = rssContentFindArgs({
      collection: 'notes',
      limit: 10,
      locale: 'ru',
      now,
    })

    expect(args.collection).toBe('notes')
    expect(args.locale).toBe('ru')
    expect(args.limit).toBe(10)
    expect(args.draft).toBe(false)
    expect(args.where).toEqual(publicContentWhere(now))
  })
})

describe('rss paths and absolute URLs', () => {
  it('maps feed kinds to public paths', () => {
    expect(rssFeedPath('all')).toBe('/rss.xml')
    expect(rssFeedPath('articles')).toBe('/articles/rss.xml')
    expect(rssFeedPath('notes')).toBe('/notes/rss.xml')
  })

  it('builds absolute locale-prefixed feed and item URLs', () => {
    expect(absoluteRssFeedUrl(origin, 'uk', 'all')).toBe('https://blog.example/uk/rss.xml')
    expect(absoluteRssFeedUrl(origin, 'ru', 'articles')).toBe(
      'https://blog.example/ru/articles/rss.xml',
    )
    expect(absoluteRssItemUrl(origin, 'en', 'notes', 'hello')).toBe(
      'https://blog.example/en/notes/hello',
    )
  })
})

describe('rssExcerpt / toRssDoc', () => {
  it('prefers metaDescription over searchText', () => {
    expect(
      rssExcerpt({
        metaDescription: '  Short blurb.  ',
        searchText: 'Long body text that would otherwise become the excerpt.',
      }),
    ).toBe('Short blurb.')
  })

  it('truncates searchText when meta is empty', () => {
    const plain = 'a'.repeat(RSS_EXCERPT_MAX + 20)
    const excerpt = rssExcerpt({ metaDescription: '   ', searchText: plain })

    expect(excerpt.endsWith('…')).toBe(true)
    expect(excerpt.length).toBe(RSS_EXCERPT_MAX + 1)
  })

  it('drops rows without title or slug', () => {
    expect(toRssDoc({ title: '', slug: 'ok' })).toBeNull()
    expect(toRssDoc({ title: 'Ok', slug: '' })).toBeNull()
    expect(
      toRssDoc({
        title: 'Hello',
        slug: 'hello',
        publishedAt: '2026-01-01T00:00:00.000Z',
        seo: { metaDescription: 'Blurb' },
      }),
    ).toEqual({
      description: 'Blurb',
      publishedAt: '2026-01-01T00:00:00.000Z',
      slug: 'hello',
      title: 'Hello',
    })
  })
})

describe('mergeRssItems', () => {
  it('sorts like the feed and keeps at most RSS_ITEM_LIMIT', () => {
    const articles: RssItem[] = [
      {
        collection: 'articles',
        description: '',
        link: `${origin}/uk/articles/older`,
        publishedAt: '2026-01-01T00:00:00.000Z',
        slug: 'older',
        title: 'Older',
      },
      {
        collection: 'articles',
        description: '',
        link: `${origin}/uk/articles/newer`,
        publishedAt: '2026-02-01T00:00:00.000Z',
        slug: 'newer',
        title: 'Newer',
      },
    ]
    const notes: RssItem[] = [
      {
        collection: 'notes',
        description: '',
        link: `${origin}/uk/notes/mid`,
        publishedAt: '2026-01-15T00:00:00.000Z',
        slug: 'mid',
        title: 'Mid',
      },
      {
        collection: 'notes',
        description: '',
        link: `${origin}/uk/notes/null-date`,
        publishedAt: null,
        slug: 'null-date',
        title: 'Null date',
      },
    ]

    const merged = mergeRssItems(articles, notes, 3)

    expect(merged.map((item) => item.slug)).toEqual(['null-date', 'newer', 'mid'])
  })
})

describe('toRssItems / buildRssXml', () => {
  it('maps docs to absolute item links', () => {
    const items = toRssItems({
      collection: 'articles',
      docs: [
        {
          title: 'Hello',
          slug: 'hello',
          publishedAt: '2026-01-01T00:00:00.000Z',
          seo: { metaDescription: 'Hi & bye' },
        },
        { title: '', slug: 'skip' },
      ],
      locale: 'uk',
      origin,
    })

    expect(items).toEqual([
      {
        collection: 'articles',
        description: 'Hi & bye',
        link: 'https://blog.example/uk/articles/hello',
        publishedAt: '2026-01-01T00:00:00.000Z',
        slug: 'hello',
        title: 'Hello',
      },
    ])
  })

  it('escapes XML special characters and emits RFC-822 pubDate', () => {
    expect(escapeXml(`A & B <C> "D" 'E'`)).toBe('A &amp; B &lt;C&gt; &quot;D&quot; &apos;E&apos;')
    expect(toRssPubDate('2026-01-01T00:00:00.000Z')).toBe('Thu, 01 Jan 2026 00:00:00 GMT')

    const xml = buildRssXml({
      channel: {
        description: 'Site & blog',
        language: 'uk',
        link: 'https://blog.example/uk/rss.xml',
        title: 'Platen <Prime>',
      },
      items: [
        {
          collection: 'articles',
          description: 'Hi & bye',
          link: 'https://blog.example/uk/articles/hello',
          publishedAt: '2026-01-01T00:00:00.000Z',
          slug: 'hello',
          title: 'Hello <world>',
        },
      ],
    })

    expect(xml).toContain('<rss version="2.0">')
    expect(xml).toContain('<title>Platen &lt;Prime&gt;</title>')
    expect(xml).toContain('<description>Site &amp; blog</description>')
    expect(xml).toContain('<title>Hello &lt;world&gt;</title>')
    expect(xml).toContain('<description>Hi &amp; bye</description>')
    expect(xml).toContain('<pubDate>Thu, 01 Jan 2026 00:00:00 GMT</pubDate>')
    expect(xml).toContain('<guid isPermaLink="true">https://blog.example/uk/articles/hello</guid>')
    expect(xml).not.toContain('<title>Hello <world></title>')
  })

  it('omits pubDate when publishedAt is missing', () => {
    const xml = buildRssXml({
      channel: {
        description: 'Empty date',
        language: 'en',
        link: 'https://blog.example/en/rss.xml',
        title: 'Blog',
      },
      items: [
        {
          collection: 'notes',
          description: '',
          link: 'https://blog.example/en/notes/x',
          publishedAt: null,
          slug: 'x',
          title: 'X',
        },
      ],
    })

    expect(xml).toContain('<title>X</title>')
    expect(xml).not.toContain('<pubDate>')
  })
})
