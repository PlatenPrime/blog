/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import { OG_SIZE, absoluteMediaUrl, resolveOgMediaUrl, toOgMediaImage } from '@/content/ogImage'

const origin = 'https://blog.example'

describe('toOgMediaImage', () => {
  it('keeps a populated upload and drops a bare id', () => {
    expect(
      toOgMediaImage({
        alt: 'Cover',
        height: 630,
        url: '/api/media/file/cover.webp',
        width: 1200,
      }),
    ).toEqual({
      alt: 'Cover',
      height: 630,
      url: '/api/media/file/cover.webp',
      width: 1200,
    })

    expect(toOgMediaImage(7)).toBeNull()
    expect(toOgMediaImage(null)).toBeNull()
    expect(toOgMediaImage({ url: '' })).toBeNull()
  })
})

describe('absoluteMediaUrl', () => {
  it('absolutizes root-relative media and leaves R2 URLs alone', () => {
    expect(absoluteMediaUrl(origin, '/api/media/file/cover.webp')).toBe(
      'https://blog.example/api/media/file/cover.webp',
    )
    expect(absoluteMediaUrl(`${origin}/`, 'api/media/file/cover.webp')).toBe(
      'https://blog.example/api/media/file/cover.webp',
    )
    expect(absoluteMediaUrl(origin, 'https://cdn.example/a.webp')).toBe(
      'https://cdn.example/a.webp',
    )
    expect(absoluteMediaUrl(origin, 'HTTP://cdn.example/a.webp')).toBe('HTTP://cdn.example/a.webp')
  })
})

describe('resolveOgMediaUrl', () => {
  it('prefers seo.ogImage, then hero, then nothing for the title card', () => {
    expect(
      resolveOgMediaUrl({
        heroUrl: '/api/media/file/hero.webp',
        ogImageUrl: '/api/media/file/og.webp',
      }),
    ).toBe('/api/media/file/og.webp')

    expect(
      resolveOgMediaUrl({
        heroUrl: '/api/media/file/hero.webp',
        ogImageUrl: '   ',
      }),
    ).toBe('/api/media/file/hero.webp')

    expect(resolveOgMediaUrl({ heroUrl: null, ogImageUrl: null })).toBeNull()
  })
})

describe('OG_SIZE', () => {
  it('matches the Open Graph default canvas', () => {
    expect(OG_SIZE).toEqual({ height: 630, width: 1200 })
  })
})
