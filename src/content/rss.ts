import config from '@payload-config'
import { getPayload } from 'payload'

import {
  absoluteRssFeedUrl,
  buildRssXml,
  mergeRssItems,
  rssContentFindArgs,
  rssOrigin,
  rssResponse,
  toRssItems,
  type RssChannel,
  type RssFeedKind,
  type RssItem,
} from '@/content/rssQuery'
import { resolveContentLocale } from '@/i18n/contentLocale'
import type { AppLocale } from '@/i18n/routing'

export type RssFeedCopy = {
  description: string
  title: string
}

/**
 * Build an RSS 2.0 response for one locale and feed kind.
 * Visibility stays in `rssContentFindArgs` (`publicContentWhere`, no session).
 */
export async function buildRssFeedResponse(args: {
  copy: RssFeedCopy
  kind: RssFeedKind
  locale: AppLocale
  now?: Date
}): Promise<Response> {
  const locale = resolveContentLocale(args.locale)
  const origin = rssOrigin()
  const items = await loadRssItems({
    kind: args.kind,
    locale,
    now: args.now,
    origin,
  })

  const channel: RssChannel = {
    description: args.copy.description,
    language: locale,
    link: absoluteRssFeedUrl(origin, locale, args.kind),
    title: args.copy.title,
  }

  return rssResponse(buildRssXml({ channel, items }))
}

async function loadRssItems(args: {
  kind: RssFeedKind
  locale: AppLocale
  now?: Date
  origin: string
}): Promise<RssItem[]> {
  const payload = await getPayload({ config })

  if (args.kind === 'articles' || args.kind === 'notes') {
    const result = await payload.find(
      rssContentFindArgs({
        collection: args.kind,
        locale: args.locale,
        now: args.now,
      }),
    )

    return toRssItems({
      collection: args.kind,
      docs: result.docs,
      locale: args.locale,
      origin: args.origin,
    })
  }

  const [articles, notes] = await Promise.all([
    payload.find(
      rssContentFindArgs({
        collection: 'articles',
        locale: args.locale,
        now: args.now,
      }),
    ),
    payload.find(
      rssContentFindArgs({
        collection: 'notes',
        locale: args.locale,
        now: args.now,
      }),
    ),
  ])

  return mergeRssItems(
    toRssItems({
      collection: 'articles',
      docs: articles.docs,
      locale: args.locale,
      origin: args.origin,
    }),
    toRssItems({
      collection: 'notes',
      docs: notes.docs,
      locale: args.locale,
      origin: args.origin,
    }),
  )
}
