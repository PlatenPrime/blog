import { getPayload, type Payload } from 'payload'

import config from '@/payload.config'

import { beforeAll, describe, expect, it } from 'vitest'

import { createTestArticle, createTestNote, createTestUser } from '../helpers/factories'

let payload: Payload

describe('Test data factories (Local API)', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('creates admin user without UI seed', async () => {
    const user = await createTestUser(payload)
    expect(user.id).toBeDefined()
    expect(user.role).toBe('admin')
    expect(user.email).toMatch(/@example\.com$/)
  })

  it('creates published article with unique slug', async () => {
    const article = await createTestArticle(payload)
    expect(article.id).toBeDefined()
    expect(article._status).toBe('published')
    expect(article.slug).toMatch(/^test-article-/)
    expect(article.title).toMatch(/^Test article /)
  })

  it('creates published note with unique slug', async () => {
    const note = await createTestNote(payload)
    expect(note.id).toBeDefined()
    expect(note._status).toBe('published')
    expect(note.slug).toMatch(/^test-note-/)
    expect(note.title).toMatch(/^Test note /)
  })
})
