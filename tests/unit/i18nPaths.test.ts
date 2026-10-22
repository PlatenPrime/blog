/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import { isAppLocale, withDefaultLocale, withLocale } from '@/i18n/paths'

describe('withDefaultLocale', () => {
  it('prefixes paths with uk', () => {
    expect(withDefaultLocale('/')).toBe('/uk')
    expect(withDefaultLocale('/login')).toBe('/uk/login')
    expect(withDefaultLocale('verify')).toBe('/uk/verify')
  })
})

describe('withLocale', () => {
  it('prefixes with the given locale', () => {
    expect(withLocale('en', '/register')).toBe('/en/register')
    expect(withLocale('ru', '/')).toBe('/ru')
  })
})

describe('isAppLocale', () => {
  it('accepts only uk/ru/en', () => {
    expect(isAppLocale('uk')).toBe(true)
    expect(isAppLocale('ru')).toBe(true)
    expect(isAppLocale('en')).toBe(true)
    expect(isAppLocale('de')).toBe(false)
    expect(isAppLocale(null)).toBe(false)
  })
})
