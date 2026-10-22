/**
 * YouTube URL sanitize helpers (roadmap 034).
 * Only allow known YouTube hosts; embed via youtube-nocookie.
 */

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
])

/** 11-char YouTube video id */
const VIDEO_ID_RE = /^[\w-]{11}$/

function normalizeHost(hostname: string): string {
  return hostname.toLowerCase().replace(/\.$/, '')
}

/**
 * Extract a YouTube video id from a user-provided URL, or null if invalid.
 */
export function parseYouTubeVideoId(raw: unknown): string | null {
  if (typeof raw !== 'string') return null

  const trimmed = raw.trim()
  if (!trimmed) return null

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return null
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null

  const host = normalizeHost(url.hostname)
  if (!YOUTUBE_HOSTS.has(host)) return null

  // youtu.be/<id>
  if (host === 'youtu.be' || host === 'www.youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0]
    return id && VIDEO_ID_RE.test(id) ? id : null
  }

  // /watch?v=<id>
  const v = url.searchParams.get('v')
  if (v && VIDEO_ID_RE.test(v)) return v

  // /embed/<id>, /shorts/<id>, /live/<id>, /v/<id>
  const parts = url.pathname.split('/').filter(Boolean)
  if (parts.length >= 2 && ['embed', 'shorts', 'live', 'v'].includes(parts[0]!)) {
    const id = parts[1]!
    return VIDEO_ID_RE.test(id) ? id : null
  }

  return null
}

/**
 * Build a privacy-enhanced embed src, or null if the URL is not a valid YouTube link.
 */
export function toYouTubeEmbedSrc(raw: unknown): string | null {
  const id = parseYouTubeVideoId(raw)
  if (!id) return null
  return `https://www.youtube-nocookie.com/embed/${id}`
}

/**
 * Payload field validate: accept only YouTube watch/share/embed URLs.
 */
export function validateYouTubeUrl(value: unknown): true | string {
  if (value == null || value === '') return 'YouTube URL is required'
  if (!parseYouTubeVideoId(value)) {
    return 'Enter a valid YouTube URL (youtube.com or youtu.be)'
  }
  return true
}
