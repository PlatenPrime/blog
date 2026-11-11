import type { Payload } from 'payload'

import type { Article, Note } from '../../src/payload-types'
import { lexicalParagraph } from './lexical'
import { uniqueSuffix } from './unique'

export type ContentLocale = 'uk' | 'ru' | 'en'
export type ContentStatus = 'draft' | 'published'
export type PublicCollection = 'articles' | 'notes'

export type CreateContentOptions = {
  title?: string
  slug?: string
  /** Plain text wrapped into a Lexical paragraph. */
  body?: string
  status?: ContentStatus
  publishedAt?: string | null
  locale?: ContentLocale
  /** Used when title/slug are omitted. */
  prefix?: string
}

export type UpsertContentBySlugInput = {
  body: string
  publishedAt: string | null
  slug: string
  status: ContentStatus
  title: string
  locale?: ContentLocale
}

function resolveTitleSlug(options: CreateContentOptions | undefined, kind: string) {
  const suffix = uniqueSuffix()
  const prefix = options?.prefix ?? kind
  return {
    title: options?.title ?? `${prefix} ${suffix}`,
    slug: options?.slug ?? `${prefix}-${suffix}`,
  }
}

export async function createArticle(
  payload: Payload,
  options: CreateContentOptions = {},
): Promise<Article> {
  const { title, slug } = resolveTitleSlug(options, 'article')
  const status = options.status ?? 'published'
  const locale = options.locale ?? 'uk'
  const bodyText = options.body ?? `Body for ${slug}`

  return (await payload.create({
    collection: 'articles',
    data: {
      title,
      slug,
      body: lexicalParagraph(bodyText),
      _status: status,
      ...(options.publishedAt !== undefined ? { publishedAt: options.publishedAt } : {}),
      heroImage: null,
      categories: [],
      tags: [],
    },
    draft: status === 'draft',
    locale,
    overrideAccess: true,
  })) as Article
}

export async function createNote(
  payload: Payload,
  options: CreateContentOptions = {},
): Promise<Note> {
  const { title, slug } = resolveTitleSlug(options, 'note')
  const status = options.status ?? 'published'
  const locale = options.locale ?? 'uk'
  const bodyText = options.body ?? `Body for ${slug}`

  return (await payload.create({
    collection: 'notes',
    data: {
      title,
      slug,
      body: lexicalParagraph(bodyText),
      _status: status,
      ...(options.publishedAt !== undefined ? { publishedAt: options.publishedAt } : {}),
      categories: [],
      tags: [],
    },
    draft: status === 'draft',
    locale,
    overrideAccess: true,
  })) as Note
}

/**
 * Find-or-replace one slug. Used by e2e setup for stable public fixtures.
 * `draft: false` on update writes the main row; `draft: true` would leave a
 * published copy on the site and only store a newer draft beside it.
 */
export async function upsertContentBySlug(
  payload: Payload,
  collection: PublicCollection,
  doc: UpsertContentBySlugInput,
): Promise<void> {
  const locale = doc.locale ?? 'uk'

  const existing = await payload.find({
    collection,
    draft: true,
    limit: 1,
    locale,
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
      locale,
      overrideAccess: true,
    })
    return
  }

  await payload.update({
    collection,
    id,
    data,
    draft: false,
    locale,
    overrideAccess: true,
  })
}
