import type { Payload } from 'payload'

import type { Article } from '@/payload-types'

import { lexicalParagraph } from './lexical'
import type { ContentLocale } from './types'
import { uniqueSuffix } from './uniqueSuffix'

export type BuildArticleDataOverrides = {
  title?: string
  slug?: string
  body?: Article['body']
  _status?: 'draft' | 'published'
  publishedAt?: string | null
  heroImage?: number | null
}

export type CreateArticleOptions = BuildArticleDataOverrides & {
  locale?: ContentLocale
}

/** Pure article create payload (no DB). Defaults: published + Lexical body. */
export function buildArticleData(overrides: BuildArticleDataOverrides = {}) {
  const suffix = uniqueSuffix()
  return {
    title: overrides.title ?? `Test article ${suffix}`,
    slug: overrides.slug ?? `test-article-${suffix}`,
    body: overrides.body ?? lexicalParagraph(`Body ${suffix}`),
    _status: overrides._status ?? ('published' as const),
    ...(overrides.publishedAt !== undefined ? { publishedAt: overrides.publishedAt } : {}),
    ...(overrides.heroImage !== undefined ? { heroImage: overrides.heroImage } : {}),
  }
}

/** Create an article via Local API; hermetic unique slug by default. */
export async function createTestArticle(
  payload: Payload,
  options: CreateArticleOptions = {},
): Promise<Article> {
  const { locale = 'uk', ...dataOverrides } = options
  return (await payload.create({
    collection: 'articles',
    locale,
    data: buildArticleData(dataOverrides),
    overrideAccess: true,
  })) as Article
}
