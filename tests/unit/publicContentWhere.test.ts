/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import { isPubliclyVisible, publicContentWhere } from '@/access/publicContentWhere'

const now = new Date('2026-10-21T12:00:00.000Z')

describe('isPubliclyVisible', () => {
  it('rejects drafts', () => {
    expect(isPubliclyVisible({ _status: 'draft', publishedAt: null }, now)).toBe(false)
  })

  it('allows published with empty publishedAt', () => {
    expect(isPubliclyVisible({ _status: 'published', publishedAt: null }, now)).toBe(true)
    expect(isPubliclyVisible({ _status: 'published' }, now)).toBe(true)
  })

  it('allows publishedAt in the past or equal to now', () => {
    expect(
      isPubliclyVisible({ _status: 'published', publishedAt: '2026-10-21T11:59:59.000Z' }, now),
    ).toBe(true)
    expect(
      isPubliclyVisible({ _status: 'published', publishedAt: '2026-10-21T12:00:00.000Z' }, now),
    ).toBe(true)
  })

  it('hides publishedAt in the future', () => {
    expect(
      isPubliclyVisible({ _status: 'published', publishedAt: '2026-10-21T12:00:01.000Z' }, now),
    ).toBe(false)
  })
})

describe('publicContentWhere', () => {
  it('requires published status and non-future publishedAt', () => {
    expect(publicContentWhere(now)).toEqual({
      and: [
        { _status: { equals: 'published' } },
        {
          or: [
            { publishedAt: { exists: false } },
            { publishedAt: { equals: null } },
            { publishedAt: { less_than_equal: '2026-10-21T12:00:00.000Z' } },
          ],
        },
      ],
    })
  })
})
