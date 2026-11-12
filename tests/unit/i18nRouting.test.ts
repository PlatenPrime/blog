/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import { localeFromPathname, prefixPublicPath } from '@/i18n/paths'
import { routing } from '@/i18n/routing'

describe('routing contract', () => {
  it('matches Payload locales and keeps the prefix on every public URL', () => {
    expect(routing.locales).toEqual(['uk', 'ru', 'en'])
    expect(routing.defaultLocale).toBe('uk')
    expect(routing.localePrefix).toBe('always')
    expect(routing.localeDetection).toBe(false)
  })
})

describe('prefixPublicPath', () => {
  it('prefixes the default locale when none is given', () => {
    expect(prefixPublicPath('/')).toBe('/uk')
    expect(prefixPublicPath('/feed')).toBe('/uk/feed')
    expect(prefixPublicPath('/articles')).toBe('/uk/articles')
    expect(prefixPublicPath('/notes/hello')).toBe('/uk/notes/hello')
  })

  it('keeps an explicit locale', () => {
    expect(prefixPublicPath('/feed', 'ru')).toBe('/ru/feed')
    expect(prefixPublicPath('/', 'en')).toBe('/en')
  })

  it('rejects paths that are not root-relative', () => {
    expect(() => prefixPublicPath('feed')).toThrow(/root-relative/)
    expect(() => prefixPublicPath('//evil.example')).toThrow(/root-relative/)
  })
})

describe('localeFromPathname', () => {
  it('reads a known prefix and falls back otherwise', () => {
    expect(localeFromPathname('/ru/feed')).toBe('ru')
    expect(localeFromPathname('/en')).toBe('en')
    expect(localeFromPathname('/uk/dev/rich-text/article/hello')).toBe('uk')
    expect(localeFromPathname('/feed')).toBe('uk')
    expect(localeFromPathname('/fr/feed')).toBe('uk')
    expect(localeFromPathname('/')).toBe('uk')
  })
})
