import config from '@payload-config'
import { cache } from 'react'
import { getPayload } from 'payload'

import {
  articlesCountArgs,
  articlesDetailFindArgs,
  articlesListFindArgs,
  articlesPageCount,
  resolveArticlesPage,
  toPublicArticle,
  type PublicArticle,
} from '@/content/articlesQuery'
import { toLatestPublicDoc, type LatestPublicDoc } from '@/content/latestPublicQuery'

export type PublicArticlesResult =
  | { kind: 'redirect'; page: number | null }
  | { items: LatestPublicDoc[]; kind: 'render'; page: number; pageCount: number }

/**
 * One page of published articles for a locale.
 * Counts first, so a page past the end redirects and never becomes a find.
 * Does not receive the session user: see `articlesCountArgs` and `articlesListFindArgs`.
 */
export const findPublicArticles = cache(
  async (locale: string, rawPage: string | undefined): Promise<PublicArticlesResult> => {
    const now = new Date()
    const payload = await getPayload({ config })
    const counted = await payload.count(articlesCountArgs({ locale, now }))
    const resolution = resolveArticlesPage(rawPage, counted.totalDocs)

    if (resolution.kind === 'redirect') {
      return { kind: 'redirect', page: resolution.page }
    }

    const found = await payload.find(articlesListFindArgs({ locale, now, page: resolution.page }))

    return {
      items: found.docs.flatMap((doc) => {
        const item = toLatestPublicDoc(doc)
        return item ? [item] : []
      }),
      kind: 'render',
      page: resolution.page,
      pageCount: articlesPageCount(counted.totalDocs),
    }
  },
)

/**
 * One published article, or null when the slug is missing, draft, or still scheduled.
 * Shared by the page and its metadata so one request does not ask twice.
 * Does not receive the session user and does not open draft mode.
 */
export const findPublicArticle = cache(
  async (locale: string, slug: string): Promise<PublicArticle | null> => {
    const payload = await getPayload({ config })
    const found = await payload.find(articlesDetailFindArgs({ locale, slug }))
    const doc = found.docs[0]
    if (!doc) return null
    return toPublicArticle(doc)
  },
)
