/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import { applyPublishedAtOnPublish } from '@/hooks/setPublishedAtOnPublish'

const now = new Date('2026-10-21T15:00:00.000Z')

describe('applyPublishedAtOnPublish', () => {
  it('stamps now when publishing without publishedAt', () => {
    expect(
      applyPublishedAtOnPublish({
        data: { _status: 'published', title: 'Hi' },
        originalDoc: { _status: 'draft' },
        now,
      }),
    ).toEqual({
      _status: 'published',
      title: 'Hi',
      publishedAt: '2026-10-21T15:00:00.000Z',
    })
  })

  it('keeps an explicit publishedAt from data', () => {
    expect(
      applyPublishedAtOnPublish({
        data: { _status: 'published', publishedAt: '2026-11-01T00:00:00.000Z' },
        originalDoc: null,
        now,
      }).publishedAt,
    ).toBe('2026-11-01T00:00:00.000Z')
  })

  it('does not overwrite when originalDoc already has publishedAt', () => {
    expect(
      applyPublishedAtOnPublish({
        data: { _status: 'published', title: 'Updated' },
        originalDoc: { _status: 'published', publishedAt: '2026-01-01T00:00:00.000Z' },
        now,
      }),
    ).toEqual({
      _status: 'published',
      title: 'Updated',
    })
  })

  it('does not stamp when status stays draft', () => {
    expect(
      applyPublishedAtOnPublish({
        data: { _status: 'draft' },
        originalDoc: { _status: 'draft' },
        now,
      }),
    ).toEqual({ _status: 'draft' })
  })
})
