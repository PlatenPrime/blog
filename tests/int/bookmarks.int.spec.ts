import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { createArticle, createVerifiedReader } from '../factories'

import { beforeAll, describe, expect, it } from 'vitest'

let payload: Payload

describe('Bookmarks access and uniqueness (Local API)', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('allows a reader to create a bookmark and sets user from session', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const reader = await createVerifiedReader(payload, {
      email: `bm-reader-${suffix}@example.com`,
    })
    const spoofTarget = await createVerifiedReader(payload, {
      email: `bm-other-${suffix}@example.com`,
    })
    const article = await createArticle(payload, {
      title: `Bookmark target ${suffix}`,
      slug: `bookmark-target-${suffix}`,
      body: 'Article body for bookmarks test.',
    })

    const bookmark = await payload.create({
      collection: 'bookmarks',
      user: reader,
      overrideAccess: false,
      data: {
        content: {
          relationTo: 'articles',
          value: article.id,
        },
        // Client must not be able to assign a different owner.
        user: spoofTarget.id,
      },
    })

    const ownerId = typeof bookmark.user === 'object' ? bookmark.user.id : bookmark.user
    expect(ownerId).toBe(reader.id)

    const content =
      typeof bookmark.content === 'object' && bookmark.content !== null ? bookmark.content : null
    expect(content?.relationTo).toBe('articles')
    const contentId =
      content && typeof content.value === 'object' ? content.value.id : content?.value
    expect(contentId).toBe(article.id)
  })

  it('denies anonymous create', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const article = await createArticle(payload, {
      title: `Anon bookmark target ${suffix}`,
      slug: `anon-bookmark-target-${suffix}`,
      body: 'Article body for anonymous deny test.',
    })

    await expect(
      payload.create({
        collection: 'bookmarks',
        overrideAccess: false,
        data: {
          content: {
            relationTo: 'articles',
            value: article.id,
          },
          user: 0,
        },
      }),
    ).rejects.toThrow()
  })

  it('blocks duplicate bookmark for the same user and content', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const reader = await createVerifiedReader(payload, {
      email: `bm-dup-${suffix}@example.com`,
    })
    const article = await createArticle(payload, {
      title: `Dup bookmark target ${suffix}`,
      slug: `dup-bookmark-target-${suffix}`,
      body: 'Article body for duplicate bookmark test.',
    })

    const content = {
      relationTo: 'articles' as const,
      value: article.id,
    }

    await payload.create({
      collection: 'bookmarks',
      user: reader,
      overrideAccess: false,
      data: { content, user: reader.id },
    })

    await expect(
      payload.create({
        collection: 'bookmarks',
        user: reader,
        overrideAccess: false,
        data: { content, user: reader.id },
      }),
    ).rejects.toThrow(/already exists/i)
  })

  it('hides another reader bookmark from find', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const owner = await createVerifiedReader(payload, {
      email: `bm-owner-${suffix}@example.com`,
    })
    const stranger = await createVerifiedReader(payload, {
      email: `bm-stranger-${suffix}@example.com`,
    })
    const article = await createArticle(payload, {
      title: `Private bookmark target ${suffix}`,
      slug: `private-bookmark-target-${suffix}`,
      body: 'Article body for ownership read test.',
    })

    const bookmark = await payload.create({
      collection: 'bookmarks',
      user: owner,
      overrideAccess: false,
      data: {
        content: {
          relationTo: 'articles',
          value: article.id,
        },
        user: owner.id,
      },
    })

    const { docs } = await payload.find({
      collection: 'bookmarks',
      user: stranger,
      overrideAccess: false,
      where: {
        id: {
          equals: bookmark.id,
        },
      },
    })

    expect(docs).toHaveLength(0)
  })
})
