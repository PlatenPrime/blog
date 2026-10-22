import type { ImageUploadFormatOptions } from 'payload'

/** Max upload size for Media (images). Enforced via Payload global `upload.limits.fileSize`. */
export const MEDIA_MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MiB

/** Allowed image MIME types for Media uploads (no SVG / video / PDF). */
export const MEDIA_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const

/** Sharp WebP quality for Media originals (roadmap 038). */
export const MEDIA_WEBP_QUALITY = 80

/**
 * Payload `upload.formatOptions`: convert JPEG/PNG/GIF/WebP uploads to WebP via sharp.
 * Animated GIF → WebP may lose animation; documented in LOCAL_SETUP / content-model.
 */
export const mediaWebpFormatOptions: ImageUploadFormatOptions = {
  format: 'webp',
  options: {
    quality: MEDIA_WEBP_QUALITY,
  },
}
