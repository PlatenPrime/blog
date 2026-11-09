import config from '@payload-config'
import { getPayload } from 'payload'

import { toLatestPublicDoc, type LatestPublicDoc } from '@/content/latestPublicQuery'
import {
  mergePublicSearch,
  normalizeSearchQuery,
  resolveSearchPage,
  searchCountArgs,
  searchFindArgs,
  searchPageCount,
  type SearchItem,
} from '@/content/searchQuery'

export type PublicSearchResult =
  | { kind: 'empty-query' }
  | { kind: 'redirect'; page: number | null; q: string }
  | { items: SearchItem[]; kind: 'render'; page: number; pageCount: number; q: string }

/**
 * One page of mixed public search hits, or empty-query / redirect.
 * Does not receive the session user: see `searchCountArgs` / `searchFindArgs`.
 * Empty / whitespace-only `q` never hits the database.
 */
export async function findPublicSearch(
  locale: string,
  rawQuery: string | undefined,
  rawPage: string | undefined,
  now?: Date,
): Promise<PublicSearchResult> {
  const q = normalizeSearchQuery(rawQuery)
  if (q === null) return { kind: 'empty-query' }

  const payload = await getPayload({ config })
  const [articlesCount, notesCount] = await Promise.all([
    payload.count(searchCountArgs({ collection: 'articles', locale, now, q })),
    payload.count(searchCountArgs({ collection: 'notes', locale, now, q })),
  ])
  const total = articlesCount.totalDocs + notesCount.totalDocs
  const resolution = resolveSearchPage(rawPage, total)

  if (resolution.kind === 'redirect') {
    return { kind: 'redirect', page: resolution.page, q }
  }

  const [articles, notes] = await Promise.all([
    payload.find(searchFindArgs({ collection: 'articles', locale, now, page: resolution.page, q })),
    payload.find(searchFindArgs({ collection: 'notes', locale, now, page: resolution.page, q })),
  ])

  return {
    items: mergePublicSearch(visibleDocs(articles.docs), visibleDocs(notes.docs), resolution.page),
    kind: 'render',
    page: resolution.page,
    pageCount: searchPageCount(total),
    q,
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
