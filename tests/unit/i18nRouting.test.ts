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
    expect(prefixPublicPath('/login')).toBe('/uk/login')
    expect(prefixPublicPath('/verify')).toBe('/uk/verify')
    expect(prefixPublicPath('/reset-password')).toBe('/uk/reset-password')
  })

  it('keeps an explicit locale', () => {
    expect(prefixPublicPath('/login', 'ru')).toBe('/ru/login')
    expect(prefixPublicPath('/', 'en')).toBe('/en')
  })

  it('rejects paths that are not root-relative', () => {
    expect(() => prefixPublicPath('login')).toThrow(/root-relative/)
    expect(() => prefixPublicPath('//evil.example')).toThrow(/root-relative/)
  })
})

describe('localeFromPathname', () => {
  it('reads a known prefix and falls back otherwise', () => {
    expect(localeFromPathname('/ru/login')).toBe('ru')
    expect(localeFromPathname('/en')).toBe('en')
    expect(localeFromPathname('/uk/dev/rich-text/article/hello')).toBe('uk')
    expect(localeFromPathname('/login')).toBe('uk')
    expect(localeFromPathname('/fr/login')).toBe('uk')
    expect(localeFromPathname('/')).toBe('uk')
  })
})
