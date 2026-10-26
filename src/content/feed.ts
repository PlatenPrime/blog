import config from '@payload-config'
import { getPayload } from 'payload'

import {
  feedCountArgs,
  feedFindArgs,
  feedPageCount,
  mergePublicFeed,
  resolveFeedPage,
  type FeedItem,
} from '@/content/feedQuery'
import { toLatestPublicDoc, type LatestPublicDoc } from '@/content/latestPublicQuery'

export type PublicFeedResult =
  | { kind: 'redirect'; page: number | null }
  | { items: FeedItem[]; kind: 'render'; page: number; pageCount: number }

/**
 * One page of the mixed public feed.
 * Counts first, so an out-of-range `page` never becomes a find limit.
 * Does not receive the session user: see `feedCountArgs` and `feedFindArgs`.
 */
export async function findPublicFeed(
  locale: string,
  rawPage: string | undefined,
  now?: Date,
): Promise<PublicFeedResult> {
  const payload = await getPayload({ config })
  const [articlesCount, notesCount] = await Promise.all([
    payload.count(feedCountArgs({ collection: 'articles', locale, now })),
    payload.count(feedCountArgs({ collection: 'notes', locale, now })),
  ])
  const total = articlesCount.totalDocs + notesCount.totalDocs
  const resolution = resolveFeedPage(rawPage, total)

  if (resolution.kind === 'redirect') {
    return { kind: 'redirect', page: resolution.page }
  }

  const [articles, notes] = await Promise.all([
    payload.find(feedFindArgs({ collection: 'articles', locale, now, page: resolution.page })),
    payload.find(feedFindArgs({ collection: 'notes', locale, now, page: resolution.page })),
  ])

  return {
    items: mergePublicFeed(visibleDocs(articles.docs), visibleDocs(notes.docs), resolution.page),
    kind: 'render',
    page: resolution.page,
    pageCount: feedPageCount(total),
  }
}

function visibleDocs(
  docs: readonly {
    publishedAt?: string | null
    slug?: string | null
    title?: string | null
  }[],
): LatestPublicDoc[] {
  return docs.flatMap((doc) => {
    const item = toLatestPublicDoc(doc)
    return item ? [item] : []
  })
}
