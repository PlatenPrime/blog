import config from '@payload-config'
import { getPayload } from 'payload'

import type { FeedItem } from '@/content/feedQuery'
import {
  toLatestPublicDoc,
  type LatestPublicCollection,
  type LatestPublicDoc,
} from '@/content/latestPublicQuery'
import { mergeRelatedContent, relatedFindArgs } from '@/content/relatedContentQuery'

/**
 * Related published titles for the reading page.
 * Empty taxonomy or no neighbours yields an empty list; the UI hides the block.
 * Does not receive the session user: see `relatedFindArgs`.
 */
export async function findRelatedContent(args: {
  categoryIds: readonly number[]
  excludeCollection: LatestPublicCollection
  excludeId: number
  locale: string
  now?: Date
  tagIds: readonly number[]
}): Promise<FeedItem[]> {
  const articlesArgs = relatedFindArgs({ ...args, collection: 'articles' })
  const notesArgs = relatedFindArgs({ ...args, collection: 'notes' })
  if (!articlesArgs || !notesArgs) return []

  const payload = await getPayload({ config })
  const [articles, notes] = await Promise.all([payload.find(articlesArgs), payload.find(notesArgs)])

  return mergeRelatedContent(visibleDocs(articles.docs), visibleDocs(notes.docs))
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
