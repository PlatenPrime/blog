import config from '@payload-config'
import { draftMode, headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import type { Where } from 'payload'

import type { PreviewCollection } from '@/preview/paths'

export type PreviewDoc = {
  title: string
  body: unknown
  _status?: ('draft' | 'published') | null
}

/**
 * Load article/note/page for temporary rich-text preview (034/035).
 * With draftMode + admin cookie: draft version via access control.
 * Without draftMode: published only.
 */
export async function loadPreviewDoc(
  collection: PreviewCollection,
  slug: string,
): Promise<PreviewDoc | null> {
  const { isEnabled: isDraftPreview } = await draftMode()
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  // Visibility (published + schedule) comes from `publishedOrAdmin` access (ADR-003).
  const where: Where = { slug: { equals: slug } }

  const { docs } = await payload.find({
    collection,
    where,
    limit: 1,
    depth: 2,
    draft: isDraftPreview,
    overrideAccess: false,
    user: user ?? undefined,
  })

  const doc = docs[0]
  if (!doc || typeof doc.title !== 'string' || doc.body == null) {
    return null
  }

  return {
    title: doc.title,
    body: doc.body,
    _status: doc._status ?? null,
  }
}
