import { getPayload, type Payload, type Where } from 'payload'
import type { Article, Comment, User } from '@/payload-types'
import config from '@/payload.config'
import { commentsFindArgs } from '@/content/commentsQuery'

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

  it('hides a comment from non-admins until an admin approves it again', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const author = await createUser(`author-${suffix}@example.com`, 'reader')
    const other = await createUser(`peer-${suffix}@example.com`, 'reader')
    const admin = await createUser(`admin-${suffix}@example.com`, 'admin')
    expect(admin.role).toBe('admin')

    const article = await payload.create({
      collection: 'articles',
      data: {
        title: `Moderation target ${suffix}`,
        slug: `moderation-target-${suffix}`,
        body: lexicalParagraph('Article body for moderation test.'),
        _status: 'published',
      },
      overrideAccess: true,
    })

    // Field access may strip `hidden` back to the default, or reject the create.
    // Either way the reader does not choose the stored status.
    const forcedBody = `Reader must not choose hidden ${suffix}`
    const forced = await payload
      .create({
        collection: 'comments',
        user: author,
        overrideAccess: false,
        data: {
          content: { relationTo: 'articles', value: article.id },
          body: forcedBody,
          author: author.id,
          moderationStatus: 'hidden',
        },
      })
      .then((doc) => ({ doc, ok: true as const }))
      .catch(() => ({ ok: false as const }))

    let forcedId: number | null = null
    if (forced.ok) {
      expect(forced.doc.moderationStatus).toBe('approved')
      forcedId = forced.doc.id
    } else {
      const stored = await payload.find({
        collection: 'comments',
        overrideAccess: true,
        where: { body: { equals: forcedBody } },
      })
      expect(stored.docs).toHaveLength(0)
    }

    const toxic = await createComment(author, article.id, `Toxic ${suffix}`)
    const sibling = await createComment(author, article.id, `Kept ${suffix}`)
    expect(toxic.moderationStatus).toBe('approved')
    expect(sibling.moderationStatus).toBe('approved')

    const viewers = [undefined, author, other] as const
    for (const viewer of viewers) {
      const ids = await idsOnArticle(article.id, viewer)
      expect(ids).toContain(toxic.id)
      expect(ids).toContain(sibling.id)
      if (forcedId != null) expect(ids).toContain(forcedId)
      await expectReadable(toxic.id, viewer)
      await expectReadable(sibling.id, viewer)
    }

    await expect(
      payload.update({
        collection: 'comments',
        id: toxic.id,
        data: { moderationStatus: 'hidden' },
        overrideAccess: false,
        user: author,
      }),
    ).rejects.toThrow()

    const stillApproved = await payload.findByID({
      collection: 'comments',
      id: toxic.id,
      depth: 0,
      overrideAccess: true,
    })
    expect(stillApproved.moderationStatus).toBe('approved')

    const hidden = await payload.update({
      collection: 'comments',
      id: toxic.id,
      data: { moderationStatus: 'hidden' },
      overrideAccess: false,
      user: admin,
    })
    expect(hidden.moderationStatus).toBe('hidden')

    for (const viewer of viewers) {
      const ids = await idsOnArticle(article.id, viewer)
      expect(ids).not.toContain(toxic.id)
      expect(ids).toContain(sibling.id)
      await expectUnreadable(toxic.id, viewer)
      await expectReadable(sibling.id, viewer)
    }

    const adminIds = await idsOnArticle(article.id, admin)
    expect(adminIds).toContain(toxic.id)
    expect(adminIds).toContain(sibling.id)
    await expectReadable(toxic.id, admin)

    const pageWhileHidden = await payload.find(
      commentsFindArgs({ relationTo: 'articles', value: article.id }),
    )
    const hiddenPageIds = pageWhileHidden.docs.map((doc) => doc.id)
    expect(hiddenPageIds).not.toContain(toxic.id)
    expect(hiddenPageIds).toContain(sibling.id)

    const restored = await payload.update({
      collection: 'comments',
      id: toxic.id,
      data: { moderationStatus: 'approved' },
      overrideAccess: false,
      user: admin,
    })
    expect(restored.moderationStatus).toBe('approved')

    for (const viewer of viewers) {
      const ids = await idsOnArticle(article.id, viewer)
      expect(ids).toContain(toxic.id)
      expect(ids).toContain(sibling.id)
      await expectReadable(toxic.id, viewer)
    }
  })
})

function articleWhere(articleId: number): Where {
  return {
    and: [
      { 'content.relationTo': { equals: 'articles' } },
      { 'content.value': { equals: articleId } },
    ],
  }
}

async function createUser(email: string, role: 'admin' | 'reader'): Promise<User> {
  // Create always runs the users hook. Without an admin actor it forces `reader`,
  // so an admin for this test is a reader row promoted afterwards.
  const created = (await payload.create({
    collection: 'users',
    data: {
      email,
      password: 'test-password-123',
      role: 'reader',
      _verified: true,
    },
    overrideAccess: true,
  })) as User

  if (role === 'reader') return created

  return (await payload.update({
    collection: 'users',
    id: created.id,
    data: { role: 'admin' },
    overrideAccess: true,
  })) as User
}

async function createComment(author: User, articleId: number, body: string): Promise<Comment> {
  return payload.create({
    collection: 'comments',
    user: author,
    overrideAccess: false,
    data: {
      content: { relationTo: 'articles', value: articleId },
      body,
      author: author.id,
      moderationStatus: 'approved',
    },
  })
}

async function idsOnArticle(articleId: number, user?: User): Promise<number[]> {
  const found = await payload.find({
    collection: 'comments',
    depth: 0,
    limit: 20,
    overrideAccess: false,
    where: articleWhere(articleId),
    ...(user ? { user } : {}),
  })
  return found.docs.map((doc) => doc.id)
}

async function expectReadable(id: number, user?: User): Promise<void> {
  const doc = await payload.findByID({
    collection: 'comments',
    id,
    depth: 0,
    overrideAccess: false,
    ...(user ? { user } : {}),
  })
  expect(doc.id).toBe(id)
}

async function expectUnreadable(id: number, user?: User): Promise<void> {
  await expect(
    payload.findByID({
      collection: 'comments',
      id,
      depth: 0,
      overrideAccess: false,
      ...(user ? { user } : {}),
    }),
  ).rejects.toThrow()
}
