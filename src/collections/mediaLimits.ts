/** Max upload size for Media (images). Enforced via Payload global `upload.limits.fileSize`. */
export const MEDIA_MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MiB

/** Allowed image MIME types for Media uploads (no SVG / video / PDF). */
export const MEDIA_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
