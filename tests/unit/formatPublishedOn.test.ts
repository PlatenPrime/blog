/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import { formatPublishedOn } from '@/content/formatPublishedOn'

describe('formatPublishedOn', () => {
  it('formats a valid ISO instant for the locale', () => {
    const formatted = formatPublishedOn('2024-06-15T12:00:00.000Z', 'en')

    expect(formatted).toBeTruthy()
    expect(formatted).not.toContain('Invalid Date')
    expect(formatted).toMatch(/2024/)
    expect(formatted).toMatch(/15|June/)
  })

  it('returns null for missing or unparseable values', () => {
    expect(formatPublishedOn('', 'en')).toBeNull()
    expect(formatPublishedOn('not-a-date', 'uk')).toBeNull()
    expect(formatPublishedOn('Invalid Date', 'ru')).toBeNull()
  })
})
