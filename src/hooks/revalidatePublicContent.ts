import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionSlug } from 'payload'
import { revalidateTag } from 'next/cache'

import { revalidateTagsForDocument, type ContentCacheCollection } from '@/cache/contentTags'
import { logger } from '@/lib/logger'

const REVALIDATE_COLLECTIONS = new Set<ContentCacheCollection>([
  'articles',
  'notes',
  'pages',
  'categories',
  'tags',
])

function isContentCacheCollection(slug: string): slug is ContentCacheCollection {
  return REVALIDATE_COLLECTIONS.has(slug as ContentCacheCollection)
}

/**
 * Immediate expire so the next guest request is a blocking miss (ADR-009).
 * Payload hooks are not Server Actions — `updateTag` is unavailable here.
 */
export function purgeContentCacheTags(tags: readonly string[]): void {
  for (const tag of tags) {
    revalidateTag(tag, { expire: 0 })
  }
}

/**
 * Pure selection + purge for tests and hooks. Swallows revalidate errors so CMS saves stay intact.
 */
export function revalidatePublicContentForDoc(args: {
  collection: CollectionSlug | string
  id: string | number
}): string[] {
  if (!isContentCacheCollection(args.collection)) return []

  const tags = revalidateTagsForDocument(args.collection, args.id)

  try {
    purgeContentCacheTags(tags)
  } catch (err) {
    logger.warn('content_cache_revalidate_failed', {
      collection: args.collection,
      id: args.id,
      tags,
      err,
    })
  }

  return tags
}

export const revalidatePublicContentAfterChange: CollectionAfterChangeHook = ({
  doc,
  collection,
}) => {
  const id = doc?.id
  if (id == null) return doc

  revalidatePublicContentForDoc({ collection: collection.slug, id })
  return doc
}

export const revalidatePublicContentAfterDelete: CollectionAfterDeleteHook = ({
  doc,
  collection,
}) => {
  const id = doc?.id
  if (id == null) return doc

  revalidatePublicContentForDoc({ collection: collection.slug, id })
  return doc
}
