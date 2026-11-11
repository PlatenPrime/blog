import { test as setup } from '@playwright/test'
import { getPayload } from 'payload'

import config from '../../src/payload.config'
import { upsertContentBySlug } from '../factories'
import { draftArticle, publicArticle, publicNote, publicPublishedAt } from './public-fixtures'

setup('seed published article, note, and a hidden draft', async () => {
  const payload = await getPayload({ config })

  await upsertContentBySlug(payload, 'articles', {
    ...publicArticle,
    publishedAt: publicPublishedAt,
    status: 'published',
  })
  await upsertContentBySlug(payload, 'notes', {
    ...publicNote,
    publishedAt: publicPublishedAt,
    status: 'published',
  })
  await upsertContentBySlug(payload, 'articles', {
    ...draftArticle,
    publishedAt: null,
    status: 'draft',
  })
})
