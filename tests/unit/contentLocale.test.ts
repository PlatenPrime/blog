/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import { resolveContentLocale } from '@/i18n/contentLocale'

describe('resolveContentLocale', () => {
  it.each(['uk', 'ru', 'en'] as const)('keeps a known locale %s', (locale) => {
    expect(resolveContentLocale(locale)).toBe(locale)
  })

  it('falls back to uk for unknown or empty values', () => {
    expect(resolveContentLocale('fr')).toBe('uk')
    expect(resolveContentLocale('')).toBe('uk')
    expect(resolveContentLocale(null)).toBe('uk')
    expect(resolveContentLocale(undefined)).toBe('uk')
  })
})
