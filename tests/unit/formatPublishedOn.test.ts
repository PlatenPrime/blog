/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import { formatPublishedOn } from '@/content/formatPublishedOn'

describe('formatPublishedOn', () => {
  it('formats a valid ISO instant as a long date per locale', () => {
    const iso = '2026-03-15T12:00:00.000Z'

    for (const locale of ['uk', 'en', 'ru'] as const) {
      const formatted = formatPublishedOn(iso, locale)
      expect(formatted).not.toBeNull()
      expect(formatted).not.toBe('Invalid Date')
      expect(formatted).toMatch(/2026/)
    }
  })

  it('returns null for unparseable or empty input', () => {
    expect(formatPublishedOn('', 'uk')).toBeNull()
    expect(formatPublishedOn('not-a-date', 'en')).toBeNull()
    expect(formatPublishedOn('Invalid Date', 'ru')).toBeNull()
  })
})
