import { publicContentWhere } from '@/access/publicContentWhere'
import { getServerUrl } from '@/lib/serverUrl'
import { absolutePublicUrl } from '@/content/sitemapQuery'
import { resolveContentLocale } from '@/i18n/contentLocale'
import type { AppLocale } from '@/i18n/routing'

/** Newest items per feed. Dual find for the mixed feed uses the same window. */
export const RSS_ITEM_LIMIT = 50

/** Plaintext excerpt ceiling when falling back from `searchText`. */
export const RSS_EXCERPT_MAX = 280

export const RSS_CONTENT_TYPE = 'application/rss+xml; charset=utf-8'

export type RssFeedKind = 'all' | 'articles' | 'notes'

export type RssContentCollection = 'articles' | 'notes'

export type RssItem = {
  collection: RssContentCollection
  description: string
  link: string
  publishedAt: string | null
  slug: string
  title: string
}

export type RssChannel = {
  description: string
  language: AppLocale
  link: string
  title: string
}

const rssContentSelect = {
  publishedAt: true,
  searchText: true,
  seo: {
    metaDescription: true,
  },
  slug: true,
  title: true,
} as const

export type RssContentFindArgs = {
  collection: RssContentCollection
  depth: 0
  draft: false
  fallbackLocale: 'uk'
  limit: number
  locale: AppLocale
  overrideAccess: false
  pagination: false
  select: typeof rssContentSelect
  sort: '-publishedAt'
  where: ReturnType<typeof publicContentWhere>
}

/**
 * Published articles or notes for one locale feed.
 * No `user` and no `req`: an admin session must not widen this to drafts.
 */
export function rssContentFindArgs(args: {
  collection: RssContentCollection
  limit?: number
  locale: string
  now?: Date
}): RssContentFindArgs {
  return {
    collection: args.collection,
    depth: 0,
    draft: false,
    fallbackLocale: 'uk',
    limit: args.limit ?? RSS_ITEM_LIMIT,
    locale: resolveContentLocale(args.locale),
    overrideAccess: false,
    pagination: false,
    select: rssContentSelect,
    sort: '-publishedAt',
    where: publicContentWhere(args.now),
  }
}

export function rssOrigin(explicit?: string): string {
  return explicit ?? getServerUrl()
}

/** Unprefixed public path of a feed document. */
export function rssFeedPath(
  kind: RssFeedKind,
): '/rss.xml' | '/articles/rss.xml' | '/notes/rss.xml' {
  if (kind === 'articles') return '/articles/rss.xml'
  if (kind === 'notes') return '/notes/rss.xml'
  return '/rss.xml'
}

export function absoluteRssFeedUrl(origin: string, locale: AppLocale, kind: RssFeedKind): string {
  return absolutePublicUrl(origin, rssFeedPath(kind), locale)
}

export function absoluteRssItemUrl(
  origin: string,
  locale: AppLocale,
  collection: RssContentCollection,
  slug: string,
): string {
  return absolutePublicUrl(origin, `/${collection}/${slug}`, locale)
}

export function rssExcerpt(args: {
  metaDescription?: string | null
  searchText?: string | null
}): string {
  const meta = typeof args.metaDescription === 'string' ? args.metaDescription.trim() : ''
  if (meta.length > 0) return meta

  const plain = typeof args.searchText === 'string' ? args.searchText.trim() : ''
  if (plain.length === 0) return ''
  if (plain.length <= RSS_EXCERPT_MAX) return plain
  return `${plain.slice(0, RSS_EXCERPT_MAX).trimEnd()}…`
}

export function toRssDoc(doc: {
  publishedAt?: string | null
  searchText?: string | null
  seo?: { metaDescription?: string | null } | null
  slug?: string | null
  title?: string | null
}): {
  description: string
  publishedAt: string | null
  slug: string
  title: string
} | null {
  if (typeof doc.title !== 'string' || doc.title.length === 0) return null
  if (typeof doc.slug !== 'string' || doc.slug.length === 0) return null

  const publishedAt =
    typeof doc.publishedAt === 'string' && doc.publishedAt.length > 0 ? doc.publishedAt : null

  return {
    description: rssExcerpt({
      metaDescription: doc.seo?.metaDescription,
      searchText: doc.searchText,
    }),
    publishedAt,
    slug: doc.slug,
    title: doc.title,
  }
}

export function toRssItems(args: {
  collection: RssContentCollection
  docs: readonly {
    publishedAt?: string | null
    searchText?: string | null
    seo?: { metaDescription?: string | null } | null
    slug?: string | null
    title?: string | null
  }[]
  locale: AppLocale
  origin: string
}): RssItem[] {
  const origin = args.origin.replace(/\/$/, '')
  const items: RssItem[] = []

  for (const doc of args.docs) {
    const mapped = toRssDoc(doc)
    if (!mapped) continue
    items.push({
      collection: args.collection,
      description: mapped.description,
      link: absoluteRssItemUrl(origin, args.locale, args.collection, mapped.slug),
      publishedAt: mapped.publishedAt,
      slug: mapped.slug,
      title: mapped.title,
    })
  }

  return items
}

/**
 * Mixed feed: same sort as the HTML лента, then the newest `RSS_ITEM_LIMIT`.
 * Callers should find at most `RSS_ITEM_LIMIT` from each collection.
 */
export function mergeRssItems(
  articles: readonly RssItem[],
  notes: readonly RssItem[],
  limit: number = RSS_ITEM_LIMIT,
): RssItem[] {
  const items = [...articles, ...notes]
  items.sort(compareRssItems)
  return items.slice(0, Math.max(0, limit))
}

function compareRssItems(a: RssItem, b: RssItem): number {
  const byDate = comparePublishedAtDesc(a.publishedAt, b.publishedAt)
  if (byDate !== 0) return byDate
  if (a.slug !== b.slug) return a.slug < b.slug ? -1 : 1
  if (a.collection !== b.collection) return a.collection < b.collection ? -1 : 1
  return 0
}

function comparePublishedAtDesc(a: string | null, b: string | null): number {
  const aTime = publishedTime(a)
  const bTime = publishedTime(b)
  if (aTime === bTime) return 0
  if (aTime === null) return -1
  if (bTime === null) return 1
  return aTime > bTime ? -1 : 1
}

function publishedTime(iso: string | null): number | null {
  if (iso === null) return null
  const time = Date.parse(iso)
  return Number.isNaN(time) ? null : time
}

export function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export function toRssPubDate(iso: string | null): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toUTCString()
}

export function buildRssXml(args: { channel: RssChannel; items: readonly RssItem[] }): string {
  const lastBuild = toRssPubDate(args.items[0]?.publishedAt ?? null) ?? new Date().toUTCString()

  const itemXml = args.items
    .map((item) => {
      const pubDate = toRssPubDate(item.publishedAt)
      return [
        '    <item>',
        `      <title>${escapeXml(item.title)}</title>`,
        `      <link>${escapeXml(item.link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(item.link)}</guid>`,
        pubDate ? `      <pubDate>${escapeXml(pubDate)}</pubDate>` : null,
        `      <description>${escapeXml(item.description)}</description>`,
        '    </item>',
      ]
        .filter((line): line is string => line !== null)
        .join('\n')
    })
    .join('\n')

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '  <channel>',
    `    <title>${escapeXml(args.channel.title)}</title>`,
    `    <link>${escapeXml(args.channel.link)}</link>`,
    `    <description>${escapeXml(args.channel.description)}</description>`,
    `    <language>${escapeXml(args.channel.language)}</language>`,
    `    <lastBuildDate>${escapeXml(lastBuild)}</lastBuildDate>`,
  ]

  if (itemXml.length > 0) lines.push(itemXml)
  lines.push('  </channel>', '</rss>')
  return `${lines.join('\n')}\n`
}

export function rssResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      'Content-Type': RSS_CONTENT_TYPE,
    },
  })
}
