/**
 * Public content image helpers (step 105).
 * Shared sizes for the reading column; R2 → next/image remotePatterns; Lexical upload → props.
 */

/** Matches `max-w-measure` (65ch) + horizontal padding on article/note/page columns. */
export const CONTENT_IMAGE_SIZES = '(max-width: 42rem) 100vw, 65ch' as const

/** Used when Payload Media has no width/height (still need intrinsic ratio for next/image). */
export const CONTENT_IMAGE_FALLBACK_WIDTH = 1200
export const CONTENT_IMAGE_FALLBACK_HEIGHT = 675

/** Shape compatible with Next.js `images.remotePatterns` entries. */
export type ImagesRemotePattern = {
  hostname: string
  pathname?: string
  port?: string
  protocol?: 'http' | 'https'
  search?: string
}

export type ContentImageSource = {
  alt: string
  height: number
  src: string
  width: number
}

export type LexicalUploadValue = {
  alt?: string | null
  filename?: string | null
  height?: number | null
  mimeType?: string | null
  url?: string | null
  width?: number | null
}

export type LexicalUploadNodeLike = {
  fields?: {
    alt?: string | null
  } | null
  value?: LexicalUploadValue | number | null
}

/**
 * Build a Next.js `images.remotePatterns` entry from an absolute origin
 * (typically `originFromPublicUrl(R2_PUBLIC_URL)`).
 */
export function remotePatternFromPublicOrigin(
  origin: string | null | undefined,
): ImagesRemotePattern | null {
  const trimmed = origin?.trim()
  if (!trimmed) return null

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    if (!parsed.hostname) return null

    const pattern: ImagesRemotePattern = {
      protocol: parsed.protocol === 'http:' ? 'http' : 'https',
      hostname: parsed.hostname,
      pathname: '/**',
    }

    if (parsed.port) {
      pattern.port = parsed.port
    }

    return pattern
  } catch {
    return null
  }
}

/**
 * Normalize Media dimensions for next/image (required width/height).
 */
export function contentImageDimensions(
  width: number | null | undefined,
  height: number | null | undefined,
): { width: number; height: number } {
  const w = typeof width === 'number' && width > 0 ? width : CONTENT_IMAGE_FALLBACK_WIDTH
  const h = typeof height === 'number' && height > 0 ? height : CONTENT_IMAGE_FALLBACK_HEIGHT
  return { width: w, height: h }
}

/**
 * Map a populated Media-like object to ContentImage props. Bare ids / empty URL → null.
 */
export function contentImageSourceFromMedia(
  media: LexicalUploadValue | null | undefined,
  altOverride?: string | null,
): ContentImageSource | null {
  if (typeof media !== 'object' || media === null) return null
  if (typeof media.url !== 'string' || media.url.length === 0) return null

  const altFromFields = typeof altOverride === 'string' ? altOverride : ''
  const altFromDoc = typeof media.alt === 'string' ? media.alt : ''
  const { width, height } = contentImageDimensions(media.width, media.height)

  return {
    alt: altFromFields || altFromDoc,
    height,
    src: media.url,
    width,
  }
}

/**
 * Lexical upload node → image source, or null when missing / non-image / unpopulated.
 * Non-image docs are left to the converter (link), not this helper.
 */
export function contentImageSourceFromUploadNode(
  node: LexicalUploadNodeLike | null | undefined,
): ContentImageSource | null {
  if (!node || typeof node.value !== 'object' || node.value === null) return null

  const mime = node.value.mimeType
  if (typeof mime === 'string' && mime.length > 0 && !mime.startsWith('image')) {
    return null
  }

  return contentImageSourceFromMedia(node.value, node.fields?.alt)
}

/**
 * True when the Lexical upload value is a non-image file (render as download link).
 */
export function isNonImageUpload(value: LexicalUploadValue | number | null | undefined): boolean {
  if (typeof value !== 'object' || value === null) return false
  const mime = value.mimeType
  return typeof mime === 'string' && mime.length > 0 && !mime.startsWith('image')
}
