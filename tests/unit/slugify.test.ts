/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import { slugify } from '@/lib/slugify'

describe('slugify', () => {
  it('converts a Latin title to a URL-safe slug', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('transliterates Ukrainian and Russian Cyrillic', () => {
    expect(slugify('Привіт світ')).toBe('pryvit-svit')
    expect(slugify('Ёлка и ґанок')).toBe('yolka-y-ganok')
  })

  it('collapses spaces and underscores into single hyphens', () => {
    expect(slugify('foo   bar_baz')).toBe('foo-bar-baz')
  })

  it('strips leading and trailing hyphens after cleanup', () => {
    expect(slugify('  --Hello--  ')).toBe('hello')
  })

  it('returns empty string for empty or punctuation-only input', () => {
    expect(slugify('')).toBe('')
    expect(slugify('!!!')).toBe('')
    expect(slugify('   ')).toBe('')
  })

  it('strips combining diacritics via NFKD', () => {
    expect(slugify('café')).toBe('cafe')
    expect(slugify('naïve')).toBe('naive')
  })

  it('keeps digits and drops other symbols', () => {
    expect(slugify("Post #42: What's next?")).toBe('post-42-whats-next')
  })
})
