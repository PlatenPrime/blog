/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import { publicContentWhere } from '@/access/publicContentWhere'
import {
  LATEST_PUBLIC_LIMIT,
  latestPublicFindArgs,
  latestPublicPath,
} from '@/content/latestPublicQuery'

const now = new Date('2026-10-21T12:00:00.000Z')

describe('latestPublicFindArgs', () => {
  it('asks only for published, already-visible titles and never the session user', () => {
    const args = latestPublicFindArgs({
      collection: 'articles',
      locale: 'ru',
      now,
    })

    expect(args).toEqual({
      collection: 'articles',
      depth: 0,
      draft: false,
      fallbackLocale: 'uk',
      limit: LATEST_PUBLIC_LIMIT,
      locale: 'ru',
      overrideAccess: false,
      pagination: false,
      select: { publishedAt: true, slug: true, title: true },
      sort: '-publishedAt',
      where: publicContentWhere(now),
    })
    expect(args).not.toHaveProperty('user')
    expect(args).not.toHaveProperty('req')
  })

  it('resolves an unknown locale to uk and keeps the note collection', () => {
    const args = latestPublicFindArgs({ collection: 'notes', locale: 'fr', now })

    expect(args.collection).toBe('notes')
    expect(args.locale).toBe('uk')
    expect(args.draft).toBe(false)
    expect(args.overrideAccess).toBe(false)
  })
})

describe('latestPublicPath', () => {
  it('points at the future article and note routes', () => {
    expect(latestPublicPath('articles', 'first-essay')).toBe('/articles/first-essay')
    expect(latestPublicPath('notes', 'short')).toBe('/notes/short')
  })
})
