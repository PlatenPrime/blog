/** @vitest-environment node */
import { createTranslator } from 'next-intl'
import { describe, expect, it } from 'vitest'

import { messagesByLocale } from '@/i18n/messages'
import { resolveAppLocale } from '@/i18n/resolveAppLocale'
import { routing } from '@/i18n/routing'

describe('resolveAppLocale (ADR-005)', () => {
  it.each(routing.locales)('keeps a known locale %s', (locale) => {
    expect(resolveAppLocale(locale)).toBe(locale)
  })

  it('falls back to uk for unknown or empty values', () => {
    expect(resolveAppLocale('fr')).toBe('uk')
    expect(resolveAppLocale('')).toBe('uk')
    expect(resolveAppLocale(null)).toBe('uk')
    expect(resolveAppLocale(undefined)).toBe('uk')
  })

  it('always yields a defined chrome catalog (no throw on pick)', () => {
    for (const input of ['uk', 'ru', 'en', 'fr', '', null, undefined] as const) {
      const locale = resolveAppLocale(input)
      expect(messagesByLocale[locale]).toBeDefined()
      expect(typeof messagesByLocale[locale].nav.login).toBe('string')
    }
  })
})

describe('missing chrome translation key (ADR-005)', () => {
  it('does not throw; returns a non-empty key-path string', () => {
    // Silence default MISSING_MESSAGE console noise; production still logs (ADR-005).
    const t = createTranslator({
      locale: 'uk',
      messages: { nav: { login: 'Вхід' } },
      namespace: 'nav',
      onError: () => undefined,
    })

    const translate = t as (key: string) => string
    let result: string | undefined

    expect(() => {
      result = translate('doesNotExist')
    }).not.toThrow()

    expect(typeof result).toBe('string')
    expect(result!.length).toBeGreaterThan(0)
    expect(result).toMatch(/doesNotExist/)
  })
})
