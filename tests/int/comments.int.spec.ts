import { getPayload, type Payload } from 'payload'
import type { Article, User } from '@/payload-types'
import config from '@/payload.config'

import { beforeAll, describe, expect, it } from 'vitest'

/** Minimal Lexical document accepted by Articles richText. */
const lexicalParagraph = (text: string): Article['body'] => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    children: [
      {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        children: [
          {
            type: 'text',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text,
            version: 1,
          },
        ],
        direction: 'ltr',
        textFormat: 0,
        textStyle: '',
      },
    ],
    direction: 'ltr',
  },
})

let payload: Payload

describe('Comments access (Local API)', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('allows a reader to create a comment and sets author from session', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const reader = (await payload.create({
      collection: 'users',
      data: {
        email: `reader-${suffix}@example.com`,
        password: 'test-password-123',
        role: 'reader',
        _verified: true,
      },
      overrideAccess: true,
    })) as User

    const spoofTarget = await payload.create({
      collection: 'users',
      data: {
        email: `other-${suffix}@example.com`,
        password: 'test-password-123',
        role: 'reader',
        _verified: true,
      },
      overrideAccess: true,
    })

    const article = await payload.create({
      collection: 'articles',
      data: {
        title: `Comment target ${suffix}`,
        slug: `comment-target-${suffix}`,
        body: lexicalParagraph('Article body for comments test.'),
        _status: 'published',
      },
      overrideAccess: true,
    })

    const comment = await payload.create({
      collection: 'comments',
      user: reader,
      overrideAccess: false,
      data: {
        content: {
          relationTo: 'articles',
          value: article.id,
        },
        body: 'Hello from reader',
        moderationStatus: 'approved',
        // Client must not be able to assign a different author.
        author: spoofTarget.id,
      },
    })

    const authorId = typeof comment.author === 'object' ? comment.author.id : comment.author
    expect(authorId).toBe(reader.id)
    expect(comment.body).toBe('Hello from reader')
    expect(comment.moderationStatus).toBe('approved')
  })

  it('denies anonymous create', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const article = await payload.create({
      collection: 'articles',
      data: {
        title: `Anon target ${suffix}`,
        slug: `anon-target-${suffix}`,
        body: lexicalParagraph('Article body for anonymous deny test.'),
        _status: 'published',
      },
      overrideAccess: true,
    })

    // `author` is required on the type; access denies before persistence.
    await expect(
      payload.create({
        collection: 'comments',
        overrideAccess: false,
        data: {
          content: {
            relationTo: 'articles',
            value: article.id,
          },
          body: 'Should not be created',
          author: 0,
          moderationStatus: 'approved',
        },
      }),
    ).rejects.toThrow()
  })
})
