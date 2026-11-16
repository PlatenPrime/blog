/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import {
  CONTENT_IMAGE_FALLBACK_HEIGHT,
  CONTENT_IMAGE_FALLBACK_WIDTH,
  CONTENT_IMAGE_SIZES,
  contentImageDimensions,
  contentImageSourceFromMedia,
  contentImageSourceFromUploadNode,
  isNonImageUpload,
  remotePatternFromPublicOrigin,
} from '@/media/contentImage'

describe('CONTENT_IMAGE_SIZES', () => {
  it('targets the reading column width', () => {
    expect(CONTENT_IMAGE_SIZES).toBe('(max-width: 42rem) 100vw, 65ch')
  })
})

describe('remotePatternFromPublicOrigin', () => {
  it('builds a Next remotePattern from an https origin', () => {
    expect(remotePatternFromPublicOrigin('https://pub.example.com')).toEqual({
      protocol: 'https',
      hostname: 'pub.example.com',
      pathname: '/**',
    })
  })

  it('keeps an explicit port', () => {
    expect(remotePatternFromPublicOrigin('http://localhost:9000')).toEqual({
      protocol: 'http',
      hostname: 'localhost',
      port: '9000',
      pathname: '/**',
    })
  })

  it('returns null for missing or invalid origins', () => {
    expect(remotePatternFromPublicOrigin(null)).toBeNull()
    expect(remotePatternFromPublicOrigin('')).toBeNull()
    expect(remotePatternFromPublicOrigin('not-a-url')).toBeNull()
    expect(remotePatternFromPublicOrigin('ftp://files.example')).toBeNull()
  })
})

describe('contentImageDimensions', () => {
  it('keeps positive dimensions and falls back otherwise', () => {
    expect(contentImageDimensions(800, 400)).toEqual({ width: 800, height: 400 })
    expect(contentImageDimensions(null, null)).toEqual({
      width: CONTENT_IMAGE_FALLBACK_WIDTH,
      height: CONTENT_IMAGE_FALLBACK_HEIGHT,
    })
    expect(contentImageDimensions(0, -1)).toEqual({
      width: CONTENT_IMAGE_FALLBACK_WIDTH,
      height: CONTENT_IMAGE_FALLBACK_HEIGHT,
    })
  })
})

describe('contentImageSourceFromMedia', () => {
  it('maps a populated upload and prefers field alt', () => {
    expect(
      contentImageSourceFromMedia(
        {
          alt: 'Doc alt',
          height: 400,
          url: '/api/media/file/cover.webp',
          width: 800,
        },
        'Field alt',
      ),
    ).toEqual({
      alt: 'Field alt',
      height: 400,
      src: '/api/media/file/cover.webp',
      width: 800,
    })

    expect(contentImageSourceFromMedia(null)).toBeNull()
    expect(contentImageSourceFromMedia({ url: '' })).toBeNull()
  })
})

describe('contentImageSourceFromUploadNode', () => {
  it('reads Lexical upload value and skips bare ids / non-images', () => {
    expect(
      contentImageSourceFromUploadNode({
        fields: { alt: 'Inline' },
        value: {
          alt: 'Media',
          height: 300,
          mimeType: 'image/webp',
          url: 'https://cdn.example/a.webp',
          width: 600,
        },
      }),
    ).toEqual({
      alt: 'Inline',
      height: 300,
      src: 'https://cdn.example/a.webp',
      width: 600,
    })

    expect(contentImageSourceFromUploadNode({ value: 12 })).toBeNull()
    expect(
      contentImageSourceFromUploadNode({
        value: {
          filename: 'notes.pdf',
          mimeType: 'application/pdf',
          url: '/api/media/file/notes.pdf',
        },
      }),
    ).toBeNull()
  })
})

describe('isNonImageUpload', () => {
  it('detects non-image media for the link fallback', () => {
    expect(isNonImageUpload({ mimeType: 'application/pdf', url: '/x.pdf' })).toBe(true)
    expect(isNonImageUpload({ mimeType: 'image/webp', url: '/x.webp' })).toBe(false)
    expect(isNonImageUpload(3)).toBe(false)
  })
})
