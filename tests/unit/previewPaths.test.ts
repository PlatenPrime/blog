/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import {
  buildPreviewPath,
  isAllowedPreviewPath,
  isPreviewCollection,
  isValidPreviewSlug,
} from '@/preview/paths'

describe('isValidPreviewSlug', () => {
  it('accepts slugify-style slugs', () => {
    expect(isValidPreviewSlug('hello-world')).toBe(true)
    expect(isValidPreviewSlug('post-42')).toBe(true)
  })

  it('rejects empty, uppercase, paths, and junk', () => {
    expect(isValidPreviewSlug('')).toBe(false)
    expect(isValidPreviewSlug('Hello')).toBe(false)
    expect(isValidPreviewSlug('a/b')).toBe(false)
    expect(isValidPreviewSlug('../x')).toBe(false)
    expect(isValidPreviewSlug(null)).toBe(false)
  })
})

describe('buildPreviewPath', () => {
  it('maps collections to temporary rich-text paths', () => {
    expect(buildPreviewPath({ collection: 'articles', slug: 'my-post' })).toBe(
      '/dev/rich-text/article/my-post',
    )
    expect(buildPreviewPath({ collection: 'notes', slug: 'quick-thought' })).toBe(
      '/dev/rich-text/note/quick-thought',
    )
    expect(buildPreviewPath({ collection: 'pages', slug: 'about' })).toBe(
      '/dev/rich-text/page/about',
    )
  })

  it('returns null for invalid slug', () => {
    expect(buildPreviewPath({ collection: 'articles', slug: 'Bad Slug' })).toBeNull()
  })
})

describe('isAllowedPreviewPath', () => {
  it('allows only allowlisted relative paths', () => {
    expect(isAllowedPreviewPath('/dev/rich-text/article/hello')).toBe(true)
    expect(isAllowedPreviewPath('/dev/rich-text/note/x')).toBe(true)
    expect(isAllowedPreviewPath('/dev/rich-text/page/about')).toBe(true)
  })

  it('rejects open redirects and unknown paths', () => {
    expect(isAllowedPreviewPath('//evil.example')).toBe(false)
    expect(isAllowedPreviewPath('https://evil.example')).toBe(false)
    expect(isAllowedPreviewPath('/articles/hello')).toBe(false)
    expect(isAllowedPreviewPath('/dev/rich-text/article/../admin')).toBe(false)
    expect(isAllowedPreviewPath('/dev/rich-text/article/hello/extra')).toBe(false)
    expect(isAllowedPreviewPath('/dev/rich-text/article/Hello')).toBe(false)
    expect(isAllowedPreviewPath(null)).toBe(false)
  })
})

describe('isPreviewCollection', () => {
  it('accepts only articles, notes, pages', () => {
    expect(isPreviewCollection('articles')).toBe(true)
    expect(isPreviewCollection('media')).toBe(false)
    expect(isPreviewCollection('users')).toBe(false)
  })
})
