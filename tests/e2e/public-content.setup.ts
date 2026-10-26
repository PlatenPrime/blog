import { test as setup } from '@playwright/test'
import { getPayload, type Payload } from 'payload'

import type { Article } from '../../src/payload-types'
import config from '../../src/payload.config'
import { draftArticle, publicArticle, publicNote, publicPublishedAt } from './public-fixtures'

/** Minimal Lexical document accepted by Articles and Notes richText. */
function lexicalParagraph(text: string): Article['body'] {
  return {
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
  }
}

type PublicCollection = 'articles' | 'notes'

type FixtureWrite = {
  body: string
  publishedAt: string | null
  slug: string
  status: 'draft' | 'published'
  title: string
}

/**
 * Find-or-replace one of our slugs.
 * `draft: false` writes the main row. `draft: true` would leave a published
 * copy on the site and only store a newer draft beside it.
 */
async function upsertPublicDoc(payload: Payload, collection: PublicCollection, doc: FixtureWrite) {
  const existing = await payload.find({
    collection,
    draft: true,
    limit: 1,
    locale: 'uk',
    overrideAccess: true,
    where: { slug: { equals: doc.slug } },
  })

  const data = {
    _status: doc.status,
    body: lexicalParagraph(doc.body),
    categories: [],
    publishedAt: doc.publishedAt,
    slug: doc.slug,
    tags: [],
    title: doc.title,
    ...(collection === 'articles' ? { heroImage: null } : {}),
  }

  const id = existing.docs[0]?.id

  if (id == null) {
    await payload.create({
      collection,
      data,
      draft: doc.status === 'draft',
      locale: 'uk',
      overrideAccess: true,
    })
    return
  }

  await payload.update({
    collection,
    id,
    data,
    draft: false,
    locale: 'uk',
    overrideAccess: true,
  })
}

setup('seed published article, note, and a hidden draft', async () => {
  const payload = await getPayload({ config })

  await upsertPublicDoc(payload, 'articles', {
    ...publicArticle,
    publishedAt: publicPublishedAt,
    status: 'published',
  })
  await upsertPublicDoc(payload, 'notes', {
    ...publicNote,
    publishedAt: publicPublishedAt,
    status: 'published',
  })
  await upsertPublicDoc(payload, 'articles', {
    ...draftArticle,
    publishedAt: null,
    status: 'draft',
  })
})
