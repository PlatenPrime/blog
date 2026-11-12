/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import { messagesByLocale } from '@/i18n/messages'
import { routing } from '@/i18n/routing'

function leafPaths(value: unknown, prefix = ''): string[] {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return prefix ? [prefix] : []
  }

  return Object.entries(value).flatMap(([key, child]) =>
    leafPaths(child, prefix ? `${prefix}.${key}` : key),
  )
}

describe('UI message catalogs', () => {
  const ukKeys = leafPaths(messagesByLocale.uk).sort()

  it.each(routing.locales)('%s has the same keys as uk', (locale) => {
    expect(leafPaths(messagesByLocale[locale]).sort()).toEqual(ukKeys)
  })

  it('includes public chrome namespaces without auth', () => {
    expect(ukKeys.some((key) => key.startsWith('nav.'))).toBe(true)
    expect(ukKeys.some((key) => key.startsWith('errors.'))).toBe(true)
    expect(ukKeys.some((key) => key.startsWith('share.'))).toBe(true)
    expect(ukKeys.some((key) => key.startsWith('auth.'))).toBe(false)
    expect(ukKeys.some((key) => key.startsWith('comments.'))).toBe(false)
    expect(ukKeys.some((key) => key.startsWith('bookmarks.'))).toBe(false)
    expect(ukKeys.some((key) => key.startsWith('account.'))).toBe(false)
    expect(ukKeys.filter((key) => key.startsWith('cookies.'))).toEqual([
      'cookies.accept',
      'cookies.body',
      'cookies.decline',
      'cookies.title',
    ])
  })

  it('sentinel chrome strings differ across locales', () => {
    const feeds = new Set(routing.locales.map((locale) => messagesByLocale[locale].nav.feed))
    const notFound = new Set(
      routing.locales.map((locale) => messagesByLocale[locale].errors.notFoundTitle),
    )

    expect(feeds.size).toBe(routing.locales.length)
    expect(notFound.size).toBe(routing.locales.length)
  })
})
