import config from '@payload-config'
import { getPayload } from 'payload'

import { feedPageCount, mergePublicFeed, resolveFeedPage, type FeedItem } from '@/content/feedQuery'
import { toLatestPublicDoc, type LatestPublicDoc } from '@/content/latestPublicQuery'
import {
  taxonomyFeedCountArgs,
  taxonomyFeedFindArgs,
  taxonomyIndexFindArgs,
  taxonomyTermFindArgs,
  toTaxonomyTerm,
  type TaxonomyCollection,
  type TaxonomyTerm,
} from '@/content/taxonomyQuery'

export type PublicTaxonomyFeed =
  | { kind: 'missing' }
  | { kind: 'redirect'; page: number | null }
  | {
      items: FeedItem[]
      kind: 'render'
      page: number
      pageCount: number
      title: string
    }

/**
 * Shelves for one locale, in title order.
 * Does not receive the session user: see `taxonomyIndexFindArgs`.
 */
export async function findPublicTaxonomyIndex(
  collection: TaxonomyCollection,
  locale: string,
): Promise<TaxonomyTerm[]> {
  const payload = await getPayload({ config })
  const result = await payload.find(taxonomyIndexFindArgs({ collection, locale }))

  return result.docs.flatMap((doc) => {
    const term = toTaxonomyTerm(doc)
    return term ? [term] : []
  })
}

/**
 * One shelf by its localized slug.
 * Does not receive the session user: see `taxonomyTermFindArgs`.
 */
export async function findPublicTaxonomyTerm(
  collection: TaxonomyCollection,
  locale: string,
  slug: string,
): Promise<TaxonomyTerm | null> {
  const payload = await getPayload({ config })
  const result = await payload.find(taxonomyTermFindArgs({ collection, locale, slug }))
  return toTaxonomyTerm(result.docs[0])
}

/**
 * One page of the mixed feed inside a shelf.
 * Counts first, so an out-of-range `page` never becomes a find limit.
 * A missing shelf is `missing`. The page turns that into the localized 404.
 * Does not receive the session user: see `taxonomyFeedCountArgs` and `taxonomyFeedFindArgs`.
 */
export async function findPublicTaxonomyFeed(
  collection: TaxonomyCollection,
  locale: string,
  slug: string,
  rawPage: string | undefined,
  now?: Date,
): Promise<PublicTaxonomyFeed> {
  const payload = await getPayload({ config })
  const term = toTaxonomyTerm(
    (await payload.find(taxonomyTermFindArgs({ collection, locale, slug }))).docs[0],
  )
  if (!term) return { kind: 'missing' }

  const shelf = { id: term.id, locale, now, taxonomy: collection }
  const [articlesCount, notesCount] = await Promise.all([
    payload.count(taxonomyFeedCountArgs({ ...shelf, collection: 'articles' })),
    payload.count(taxonomyFeedCountArgs({ ...shelf, collection: 'notes' })),
  ])
  const total = articlesCount.totalDocs + notesCount.totalDocs
  const resolution = resolveFeedPage(rawPage, total)

  if (resolution.kind === 'redirect') {
    return { kind: 'redirect', page: resolution.page }
  }

  const window = { ...shelf, page: resolution.page }
  const [articles, notes] = await Promise.all([
    payload.find(taxonomyFeedFindArgs({ ...window, collection: 'articles' })),
    payload.find(taxonomyFeedFindArgs({ ...window, collection: 'notes' })),
  ])

  return {
    items: mergePublicFeed(visibleDocs(articles.docs), visibleDocs(notes.docs), resolution.page),
    kind: 'render',
    page: resolution.page,
    pageCount: feedPageCount(total),
    title: term.title,
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
