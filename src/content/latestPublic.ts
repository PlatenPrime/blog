import config from '@payload-config'
import { getPayload } from 'payload'

import {
  latestPublicFindArgs,
  toLatestPublicDoc,
  type LatestPublicCollection,
  type LatestPublicDoc,
} from '@/content/latestPublicQuery'

/**
 * Latest publicly visible articles or notes for one locale.
 * Does not receive the session user: see `latestPublicFindArgs`.
 */
export async function findLatestPublic(
  collection: LatestPublicCollection,
  locale: string,
  now?: Date,
): Promise<LatestPublicDoc[]> {
  const payload = await getPayload({ config })
  const { docs } = await payload.find(latestPublicFindArgs({ collection, locale, now }))

  return docs.flatMap((doc) => {
    const item = toLatestPublicDoc(doc)
    return item ? [item] : []
  })
}
