import type { GeneratePreviewURL } from 'payload'

import { buildPreviewPath, type PreviewCollection } from './paths'

/**
 * Payload `admin.preview` factory: relative `/next/preview?...` with secret (roadmap 035).
 * `path` query uses default-locale preview URL (`/uk/dev/rich-text/...`, ADR-004).
 */
export function createPreviewUrl(collection: PreviewCollection): GeneratePreviewURL {
  return (doc) => {
    const slug = typeof doc.slug === 'string' ? doc.slug : null
    if (!slug) return null

    const path = buildPreviewPath({ collection, slug })
    if (!path) return null

    const previewSecret = process.env.PREVIEW_SECRET
    if (!previewSecret) {
      // Misconfigured env: hide Preview button rather than emit an open URL.
      return null
    }

    const params = new URLSearchParams({
      path,
      collection,
      slug,
      previewSecret,
    })

    return `/next/preview?${params.toString()}`
  }
}
