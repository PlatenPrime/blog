/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import { parseYouTubeVideoId, toYouTubeEmbedSrc, validateYouTubeUrl } from '@/lib/youtube'

describe('parseYouTubeVideoId', () => {
  it('parses watch?v= URLs', () => {
    expect(parseYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(parseYouTubeVideoId('https://youtube.com/watch?v=dQw4w9WgXcQ&t=10s')).toBe(
      'dQw4w9WgXcQ',
    )
  })

  it('parses youtu.be short links', () => {
    expect(parseYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('parses embed, shorts, and live paths', () => {
    expect(parseYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(parseYouTubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(parseYouTubeVideoId('https://www.youtube.com/live/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('rejects non-YouTube hosts and dangerous schemes', () => {
    expect(parseYouTubeVideoId('https://evil.example/watch?v=dQw4w9WgXcQ')).toBeNull()
    expect(parseYouTubeVideoId('javascript:alert(1)')).toBeNull()
    expect(parseYouTubeVideoId('https://www.youtube.com.evil.com/watch?v=dQw4w9WgXcQ')).toBeNull()
  })

  it('rejects empty, invalid, or non-string input', () => {
    expect(parseYouTubeVideoId('')).toBeNull()
    expect(parseYouTubeVideoId('   ')).toBeNull()
    expect(parseYouTubeVideoId('not-a-url')).toBeNull()
    expect(parseYouTubeVideoId(null)).toBeNull()
    expect(parseYouTubeVideoId(42)).toBeNull()
    expect(parseYouTubeVideoId('https://www.youtube.com/watch?v=short')).toBeNull()
  })
})

describe('toYouTubeEmbedSrc', () => {
  it('returns youtube-nocookie embed URL', () => {
    expect(toYouTubeEmbedSrc('https://youtu.be/dQw4w9WgXcQ')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    )
  })

  it('returns null for invalid URLs', () => {
    expect(toYouTubeEmbedSrc('https://vimeo.com/123')).toBeNull()
  })
})

describe('validateYouTubeUrl', () => {
  it('accepts valid YouTube URLs', () => {
    expect(validateYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true)
  })

  it('rejects missing or invalid values with a message', () => {
    expect(validateYouTubeUrl('')).toMatch(/required/i)
    expect(validateYouTubeUrl('https://example.com')).toMatch(/valid YouTube/i)
  })
})
