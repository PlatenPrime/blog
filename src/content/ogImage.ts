/**
 * Open Graph image helpers (step 069).
 * Absolute media URLs and the seo.ogImage → hero → template fallback chain.
 */

export const OG_SIZE = {
  width: 1200,
  height: 630,
} as const

export const OG_CONTENT_TYPE = 'image/png'

export const OG_FONT_FAMILY = 'Source Serif 4'

export type OgMediaImage = {
  alt: string
  height: number | null
  url: string
  width: number | null
}

export type OgUploadLike =
  | number
  | {
      alt?: string | null
      height?: number | null
      url?: string | null
      width?: number | null
    }
  | null
  | undefined

/**
 * Turn a Payload upload into a public image row.
 * A bare id (depth 0) is not a preview — drop it.
 */
export function toOgMediaImage(image: OgUploadLike): OgMediaImage | null {
  if (typeof image !== 'object' || image === null) return null
  if (typeof image.url !== 'string' || image.url.length === 0) return null

  return {
    alt: typeof image.alt === 'string' ? image.alt : '',
    height: typeof image.height === 'number' ? image.height : null,
    url: image.url,
    width: typeof image.width === 'number' ? image.width : null,
  }
}

/**
 * Media URLs from Payload are root-relative in local/dev and absolute on R2.
 * Social crawlers need an absolute URL either way.
 */
export function absoluteMediaUrl(origin: string, url: string): string {
  const trimmed = url.trim()
  if (trimmed.length === 0) return trimmed

  if (/^https?:\/\//i.test(trimmed)) return trimmed

  const base = origin.replace(/\/$/, '')
  if (trimmed.startsWith('/')) return `${base}${trimmed}`
  return `${base}/${trimmed}`
}

/**
 * Prefer an explicit SEO image, then the article cover.
 * Callers turn `null` into the ImageResponse title card.
 */
export function resolveOgMediaUrl(args: {
  heroUrl?: string | null
  ogImageUrl?: string | null
}): string | null {
  const og = blankToNull(args.ogImageUrl)
  if (og) return og

  return blankToNull(args.heroUrl)
}

function blankToNull(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}
