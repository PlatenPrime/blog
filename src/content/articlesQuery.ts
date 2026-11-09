import type { SerializedEditorState } from 'lexical'
import type { Where } from 'payload'

import { publicContentWhere } from '@/access/publicContentWhere'
import {
  numberedPageHref,
  pageCount,
  readPageParam,
  resolveNumberedPage,
  type NumberedPageHref,
  type NumberedPageResolution,
} from '@/content/numberedPage'
import {
  taxonomyIds,
  taxonomyLinks,
  type TaxonomyLink,
  type TaxonomyRelationLike,
} from '@/content/taxonomyLinks'
import { toOgMediaImage, type OgMediaImage, type OgUploadLike } from '@/content/ogImage'
import { resolveContentLocale } from '@/i18n/contentLocale'
import type { AppLocale } from '@/i18n/routing'

/** Titles per articles page. Same size as the mixed feed, so the two lists turn together. */
export const ARTICLES_PAGE_SIZE = 10

const articlesListSelect = {
  publishedAt: true,
  slug: true,
  title: true,
} as const

const articlesDetailSelect = {
  body: true,
  categories: true,
  heroImage: true,
  publishedAt: true,
  searchText: true,
  seo: {
    metaDescription: true,
    metaTitle: true,
    ogImage: true,
  },
  slug: true,
  tags: true,
  title: true,
} as const

export type ArticlesCountArgs = {
  collection: 'articles'
  locale: AppLocale
  overrideAccess: false
  where: ReturnType<typeof publicContentWhere>
}

/**
 * List find for one SQL page.
 * `sort: '-publishedAt'` matches Postgres `DESC NULLS FIRST`: an empty date
 * stays ahead of any real instant, same as the mixed feed.
 * No `user` and no `req`: an admin session must not widen this to drafts.
 */
export type ArticlesListFindArgs = {
  collection: 'articles'
  depth: 0
  draft: false
  fallbackLocale: 'uk'
  limit: typeof ARTICLES_PAGE_SIZE
  locale: AppLocale
  overrideAccess: false
  page: number
  pagination: true
  select: typeof articlesListSelect
  sort: '-publishedAt'
  where: ReturnType<typeof publicContentWhere>
}

export type ArticlesDetailFindArgs = {
  collection: 'articles'
  depth: 1
  draft: false
  fallbackLocale: 'uk'
  limit: 1
  locale: AppLocale
  overrideAccess: false
  pagination: false
  select: typeof articlesDetailSelect
  where: Where
}

export type ArticlesPageHref = NumberedPageHref<'/articles'>

export type ArticlesPageResolution = NumberedPageResolution

export type ArticleHeroImage = OgMediaImage

export type PublicArticle = {
  body: SerializedEditorState
  categories: TaxonomyLink[]
  /** Ids for related queries. Links use `categories`; these stay off the UI. */
  categoryIds: number[]
  hero: ArticleHeroImage | null
  /** Payload id. Comments attach to it; it is not a selected field. */
  id: number
  metaDescription: string | null
  metaTitle: string | null
  /** Explicit SEO image; OG falls back to `hero` when unset. */
  ogImage: ArticleHeroImage | null
  publishedAt: string | null
  /** Plaintext body for meta description fallback when SEO description is empty. */
  searchText: string | null
  tags: TaxonomyLink[]
  /** Ids for related queries. Links use `tags`; these stay off the UI. */
  tagIds: number[]
  title: string
}

export type ArticleDetailSource = {
  body?: unknown
  categories?: readonly TaxonomyRelationLike[] | null
  heroImage?: OgUploadLike
  id?: number | null
  publishedAt?: string | null
  searchText?: string | null
  seo?: {
    metaDescription?: string | null
    metaTitle?: string | null
    ogImage?: OgUploadLike
  } | null
  tags?: readonly TaxonomyRelationLike[] | null
  title?: string | null
}

/**
 * Count arguments for the public article list.
 * No `user` and no `req`. `count` has no `draft` flag; `where` is the visibility rule.
 */
export function articlesCountArgs(args: { locale: string; now?: Date }): ArticlesCountArgs {
  return {
    collection: 'articles',
    locale: resolveContentLocale(args.locale),
    overrideAccess: false,
    where: publicContentWhere(args.now),
  }
}

export function articlesListFindArgs(args: {
  locale: string
  now?: Date
  page: number
}): ArticlesListFindArgs {
  return {
    collection: 'articles',
    depth: 0,
    draft: false,
    fallbackLocale: 'uk',
    limit: ARTICLES_PAGE_SIZE,
    locale: resolveContentLocale(args.locale),
    overrideAccess: false,
    page: args.page,
    pagination: true,
    select: articlesListSelect,
    sort: '-publishedAt',
    where: publicContentWhere(args.now),
  }
}

/**
 * One public article by its localized slug.
 * `depth: 1` populates the cover and taxonomy links. An id-only relation is dropped later.
 */
export function articlesDetailFindArgs(args: {
  locale: string
  now?: Date
  slug: string
}): ArticlesDetailFindArgs {
  return {
    collection: 'articles',
    depth: 1,
    draft: false,
    fallbackLocale: 'uk',
    limit: 1,
    locale: resolveContentLocale(args.locale),
    overrideAccess: false,
    pagination: false,
    select: articlesDetailSelect,
    where: {
      and: [{ slug: { equals: args.slug } }, publicContentWhere(args.now)],
    },
  }
}

export function articlesPageCount(total: number): number {
  return pageCount(total, ARTICLES_PAGE_SIZE)
}

export function readArticlesPageParam(page: string | string[] | undefined): string | undefined {
  return readPageParam(page)
}

export function resolveArticlesPage(
  raw: string | undefined,
  total: number,
): ArticlesPageResolution {
  return resolveNumberedPage(raw, total, ARTICLES_PAGE_SIZE)
}

export function articlesPageHref(page: number): ArticlesPageHref {
  return numberedPageHref('/articles', page)
}

export function toArticleHero(image: OgUploadLike): ArticleHeroImage | null {
  return toOgMediaImage(image)
}

/**
 * A row the reading page can render.
 * Blank SEO text is unset, so the visible title and the site description stay in charge.
 * A document without a title or a Lexical body is not a page.
 */
export function toPublicArticle(doc: ArticleDetailSource): PublicArticle | null {
  if (typeof doc.id !== 'number') return null
  if (typeof doc.title !== 'string' || doc.title.length === 0) return null
  if (!isEditorState(doc.body)) return null

  const publishedAt =
    typeof doc.publishedAt === 'string' && doc.publishedAt.length > 0 ? doc.publishedAt : null

  return {
    body: doc.body,
    categories: taxonomyLinks(doc.categories),
    categoryIds: taxonomyIds(doc.categories),
    hero: toArticleHero(doc.heroImage),
    id: doc.id,
    metaDescription: blankToNull(doc.seo?.metaDescription),
    metaTitle: blankToNull(doc.seo?.metaTitle),
    ogImage: toOgMediaImage(doc.seo?.ogImage),
    publishedAt,
    searchText: blankToNull(doc.searchText),
    tags: taxonomyLinks(doc.tags),
    tagIds: taxonomyIds(doc.tags),
    title: doc.title,
  }
}

function blankToNull(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function isEditorState(value: unknown): value is SerializedEditorState {
  return typeof value === 'object' && value !== null && 'root' in value
}
