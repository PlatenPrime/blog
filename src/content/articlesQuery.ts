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
  seo: {
    metaDescription: true,
    metaTitle: true,
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

export type ArticleHeroImage = {
  alt: string
  height: number | null
  url: string
  width: number | null
}

export type PublicArticle = {
  body: SerializedEditorState
  categories: string[]
  hero: ArticleHeroImage | null
  metaDescription: string | null
  metaTitle: string | null
  publishedAt: string | null
  tags: string[]
  title: string
}

type RelationLike = number | { title?: string | null } | null

type HeroLike =
  | number
  | {
      alt?: string | null
      height?: number | null
      url?: string | null
      width?: number | null
    }
  | null

export type ArticleDetailSource = {
  body?: unknown
  categories?: readonly RelationLike[] | null
  heroImage?: HeroLike
  publishedAt?: string | null
  seo?: { metaDescription?: string | null; metaTitle?: string | null } | null
  tags?: readonly RelationLike[] | null
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
 * `depth: 1` populates the cover and taxonomy titles. An id-only relation is dropped later.
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

/** Populated relation titles, in CMS order. A bare id is not a name. */
export function relationTitles(values: readonly RelationLike[] | null | undefined): string[] {
  if (!values) return []

  return values.flatMap((value) => {
    if (typeof value !== 'object' || value === null) return []
    if (typeof value.title !== 'string' || value.title.length === 0) return []
    return [value.title]
  })
}

export function toArticleHero(image: HeroLike | undefined): ArticleHeroImage | null {
  if (typeof image !== 'object' || image === null) return null
  if (typeof image.url !== 'string' || image.url.length === 0) return null

  return {
    alt: typeof image.alt === 'string' ? image.alt : '',
    height: typeof image.height === 'number' ? image.height : null,
    url: image.url,
    width: typeof image.width === 'number' ? image.width : null,
  }
}

/**
 * A row the reading page can render.
 * Blank SEO text is unset, so the visible title and the site description stay in charge.
 * A document without a title or a Lexical body is not a page.
 */
export function toPublicArticle(doc: ArticleDetailSource): PublicArticle | null {
  if (typeof doc.title !== 'string' || doc.title.length === 0) return null
  if (!isEditorState(doc.body)) return null

  const publishedAt =
    typeof doc.publishedAt === 'string' && doc.publishedAt.length > 0 ? doc.publishedAt : null

  return {
    body: doc.body,
    categories: relationTitles(doc.categories),
    hero: toArticleHero(doc.heroImage),
    metaDescription: blankToNull(doc.seo?.metaDescription),
    metaTitle: blankToNull(doc.seo?.metaTitle),
    publishedAt,
    tags: relationTitles(doc.tags),
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
