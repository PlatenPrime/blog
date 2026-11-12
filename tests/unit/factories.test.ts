/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import {
  buildArticleData,
  buildNoteData,
  buildUserData,
  lexicalParagraph,
  uniqueSuffix,
} from '../helpers/factories'

describe('test data factories (pure)', () => {
  it('uniqueSuffix returns distinct non-empty fragments', () => {
    const a = uniqueSuffix()
    const b = uniqueSuffix()
    expect(a.length).toBeGreaterThan(0)
    expect(b.length).toBeGreaterThan(0)
    expect(a).not.toBe(b)
  })

  it('lexicalParagraph builds a root paragraph with the given text', () => {
    const doc = lexicalParagraph('hello factories')
    expect(doc.root.type).toBe('root')
    const paragraph = doc.root.children[0]
    expect(paragraph?.type).toBe('paragraph')
    const textNode = paragraph?.children?.[0] as { text?: string } | undefined
    expect(textNode?.text).toBe('hello factories')
  })

  it('buildUserData defaults to admin with unique email', () => {
    const a = buildUserData()
    const b = buildUserData()
    expect(a.role).toBe('admin')
    expect(a.password).toBe('test-password-123')
    expect(a.email).toMatch(/@example\.com$/)
    expect(a.email).not.toBe(b.email)
  })

  it('buildUserData respects overrides', () => {
    const data = buildUserData({
      email: 'fixed@example.com',
      password: 'custom-pass',
    })
    expect(data.email).toBe('fixed@example.com')
    expect(data.password).toBe('custom-pass')
    expect(data.role).toBe('admin')
  })

  it('buildArticleData defaults to published with unique slug', () => {
    const a = buildArticleData()
    const b = buildArticleData()
    expect(a._status).toBe('published')
    expect(a.slug).toMatch(/^test-article-/)
    expect(a.slug).not.toBe(b.slug)
    expect(a.body.root.type).toBe('root')
  })

  it('buildArticleData respects draft and publishedAt overrides', () => {
    const data = buildArticleData({
      title: 'Draft title',
      slug: 'draft-slug',
      _status: 'draft',
      publishedAt: '2030-01-01T00:00:00.000Z',
    })
    expect(data.title).toBe('Draft title')
    expect(data.slug).toBe('draft-slug')
    expect(data._status).toBe('draft')
    expect(data.publishedAt).toBe('2030-01-01T00:00:00.000Z')
  })

  it('buildNoteData defaults to published with unique slug', () => {
    const a = buildNoteData()
    const b = buildNoteData()
    expect(a._status).toBe('published')
    expect(a.slug).toMatch(/^test-note-/)
    expect(a.slug).not.toBe(b.slug)
    expect(a.body.root.type).toBe('root')
  })

  it('buildNoteData respects overrides', () => {
    const body = lexicalParagraph('custom note')
    const data = buildNoteData({
      title: 'Note title',
      slug: 'note-slug',
      body,
      _status: 'draft',
    })
    expect(data.title).toBe('Note title')
    expect(data.slug).toBe('note-slug')
    expect(data.body).toBe(body)
    expect(data._status).toBe('draft')
  })
})
