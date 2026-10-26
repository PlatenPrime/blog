/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import { publicContentWhere } from '@/access/publicContentWhere'
import {
  NOTES_PAGE_SIZE,
  notesCountArgs,
  notesDetailFindArgs,
  notesListFindArgs,
  notesPageHref,
  resolveNotesPage,
  toPublicNote,
} from '@/content/notesQuery'

const now = new Date('2026-10-26T12:00:00.000Z')

const body = { root: { type: 'root' } }

describe('notesCountArgs', () => {
  it('counts published notes and never the session user', () => {
    const args = notesCountArgs({ locale: 'fr', now })

    expect(args).toEqual({
      collection: 'notes',
      locale: 'uk',
      overrideAccess: false,
      where: publicContentWhere(now),
    })
    expect(args).not.toHaveProperty('user')
    expect(args).not.toHaveProperty('req')
    expect(args).not.toHaveProperty('draft')
  })
})

describe('notesListFindArgs', () => {
  it('asks for one SQL page of notes under the public visibility contract', () => {
    const args = notesListFindArgs({ locale: 'ru', now, page: 2 })

    expect(args).toEqual({
      collection: 'notes',
      depth: 0,
      draft: false,
      fallbackLocale: 'uk',
      limit: NOTES_PAGE_SIZE,
      locale: 'ru',
      overrideAccess: false,
      page: 2,
      pagination: true,
      select: {
        publishedAt: true,
        slug: true,
        title: true,
      },
      sort: '-publishedAt',
      where: publicContentWhere(now),
    })
    expect(args.collection).not.toBe('articles')
    expect(args).not.toHaveProperty('user')
    expect(args).not.toHaveProperty('req')
  })
})

describe('notesDetailFindArgs', () => {
  it('loads one note slug with drafts closed and no cover', () => {
    const args = notesDetailFindArgs({ locale: 'en', now, slug: 'short-thought' })

    expect(args.collection).toBe('notes')
    expect(args.depth).toBe(1)
    expect(args.draft).toBe(false)
    expect(args.limit).toBe(1)
    expect(args.locale).toBe('en')
    expect(args.overrideAccess).toBe(false)
    expect(args.pagination).toBe(false)
    expect(args.select).not.toHaveProperty('heroImage')
    expect(args.where).toEqual({
      and: [{ slug: { equals: 'short-thought' } }, publicContentWhere(now)],
    })
    expect(args).not.toHaveProperty('user')
    expect(args).not.toHaveProperty('req')
  })
})

describe('resolveNotesPage', () => {
  it('sends page 1 and garbage to the canonical url', () => {
    expect(resolveNotesPage(undefined, 25)).toEqual({ kind: 'render', page: 1 })
    expect(resolveNotesPage('1', 25)).toEqual({ kind: 'redirect', page: null })
    expect(resolveNotesPage('0', 25)).toEqual({ kind: 'redirect', page: null })
    expect(resolveNotesPage('nope', 25)).toEqual({ kind: 'redirect', page: null })
  })

  it('clamps a page past the end to the last page', () => {
    expect(resolveNotesPage('2', 25)).toEqual({ kind: 'render', page: 2 })
    expect(resolveNotesPage('4', 25)).toEqual({ kind: 'redirect', page: 3 })
  })
})

describe('notesPageHref', () => {
  it('omits the query on the first page', () => {
    expect(notesPageHref(1)).toBe('/notes')
    expect(notesPageHref(0)).toBe('/notes')
    expect(notesPageHref(2)).toEqual({ pathname: '/notes', query: { page: '2' } })
  })
})

describe('toPublicNote', () => {
  it('keeps taxonomy titles and seo text, and has no cover', () => {
    const note = toPublicNote({
      body,
      categories: [{ title: 'City' }, 4, { title: '' }, null],
      publishedAt: '2026-06-01T00:00:00.000Z',
      seo: { metaDescription: ' A line ', metaTitle: ' Thought ' },
      tags: [9, { title: 'Night' }],
      title: 'Short thought',
    })

    expect(note).toEqual({
      body,
      categories: ['City'],
      metaDescription: 'A line',
      metaTitle: 'Thought',
      publishedAt: '2026-06-01T00:00:00.000Z',
      tags: ['Night'],
      title: 'Short thought',
    })
    expect(note).not.toHaveProperty('hero')
  })

  it('drops blank seo and a document that cannot be read', () => {
    expect(
      toPublicNote({
        body,
        seo: { metaDescription: '   ', metaTitle: '' },
        title: 'Untitled note',
      }),
    ).toMatchObject({
      metaDescription: null,
      metaTitle: null,
      title: 'Untitled note',
    })

    expect(toPublicNote({ body, title: '' })).toBeNull()
    expect(toPublicNote({ body: null, title: 'No body' })).toBeNull()
    expect(toPublicNote({ body: 'plain', title: 'Plain' })).toBeNull()
  })
})
