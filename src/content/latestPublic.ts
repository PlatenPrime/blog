import config from '@payload-config'
import { getPayload } from 'payload'

import { listCacheTags } from '@/cache/contentTags'
import { withContentCache } from '@/cache/withContentCache'
import {
  latestPublicFindArgs,
  toLatestPublicDoc,
  type LatestPublicCollection,
  type LatestPublicDoc,
} from '@/content/latestPublicQuery'

/**
 * Latest publicly visible articles or notes for one locale.
 * Does not receive the session user: see `latestPublicFindArgs`.
 * Optional `now` bypasses the cross-request cache (tests / explicit clock).
 */
export async function findLatestPublic(
  collection: LatestPublicCollection,
  locale: string,
  now?: Date,
): Promise<LatestPublicDoc[]> {
  if (now) {
    return loadLatestPublic(collection, locale, now)
  }

  return withContentCache(['findLatestPublic', collection, locale], listCacheTags(collection), () =>
    loadLatestPublic(collection, locale, new Date()),
  )
}

async function loadLatestPublic(
  collection: LatestPublicCollection,
  locale: string,
  now: Date,
): Promise<LatestPublicDoc[]> {
  const payload = await getPayload({ config })
  const { docs } = await payload.find(latestPublicFindArgs({ collection, locale, now }))

  return docs.flatMap((doc) => {
    const item = toLatestPublicDoc(doc)
    return item ? [item] : []
  })
}
