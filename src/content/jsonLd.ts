/**
 * JSON-LD builders (step 070).
 * WebSite / Person / Article with absolute locale-aware URLs.
 */

import { absoluteMediaUrl, resolveOgMediaUrl } from '@/content/ogImage'
import { ABOUT_PAGE_SLUG, contactMailto } from '@/content/pagesQuery'
import { absolutePublicUrl } from '@/content/sitemapQuery'
import type { AppLocale } from '@/i18n/routing'

export const JSON_LD_CONTEXT = 'https://schema.org' as const

export type JsonLdObject = Record<string, unknown>

export type WebsiteJsonLdInput = {
  description: string
  locale: AppLocale
  name: string
  origin: string
}

export type PersonJsonLdInput = {
  contactEmail?: string | null
  locale: AppLocale
  name: string
  origin: string
}

export type ArticleJsonLdInput = {
  description?: string | null
  heroUrl?: string | null
  locale: AppLocale
  ogImageUrl?: string | null
  origin: string
  pathname: `/articles/${string}` | `/notes/${string}`
  publishedAt?: string | null
  title: string
}

/** Stable site node id — shared across locales so Article can point at one Person. */
export function websiteJsonLdId(origin: string): string {
  return `${stripTrailingSlash(origin)}/#website`
}

/** Stable author node id for a single-author blog. */
export function personJsonLdId(origin: string): string {
  return `${stripTrailingSlash(origin)}/#person`
}

export function buildWebsiteJsonLd(input: WebsiteJsonLdInput): JsonLdObject {
  const origin = stripTrailingSlash(input.origin)
  const url = absolutePublicUrl(origin, '/', input.locale)

  return {
    '@context': JSON_LD_CONTEXT,
    '@id': websiteJsonLdId(origin),
    '@type': 'WebSite',
    description: input.description,
    inLanguage: input.locale,
    name: input.name,
    publisher: { '@id': personJsonLdId(origin) },
    url,
  }
}

export function buildPersonJsonLd(input: PersonJsonLdInput): JsonLdObject {
  const origin = stripTrailingSlash(input.origin)
  const url = absolutePublicUrl(origin, `/${ABOUT_PAGE_SLUG}`, input.locale)
  const email = contactEmailFromEnv(input.contactEmail)

  const person: JsonLdObject = {
    '@context': JSON_LD_CONTEXT,
    '@id': personJsonLdId(origin),
    '@type': 'Person',
    name: input.name,
    url,
  }

  if (email) person.email = email
  return person
}

export function buildArticleJsonLd(input: ArticleJsonLdInput): JsonLdObject {
  const origin = stripTrailingSlash(input.origin)
  const url = absolutePublicUrl(origin, input.pathname, input.locale)
  const description = blankToNull(input.description)
  const publishedAt = blankToNull(input.publishedAt)

  const article: JsonLdObject = {
    '@context': JSON_LD_CONTEXT,
    '@type': 'Article',
    author: { '@id': personJsonLdId(origin) },
    headline: input.title,
    image: resolveArticleImageUrl({
      heroUrl: input.heroUrl,
      ogImageUrl: input.ogImageUrl,
      origin,
      pageUrl: url,
    }),
    inLanguage: input.locale,
    isPartOf: { '@id': websiteJsonLdId(origin) },
    mainEntityOfPage: {
      '@id': url,
      '@type': 'WebPage',
    },
    url,
  }

  if (description) article.description = description
  if (publishedAt) article.datePublished = publishedAt

  return article
}

/**
 * Prefer CMS media (seo.ogImage → hero), else the page opengraph-image route
 * that Next already serves for social cards.
 */
export function resolveArticleImageUrl(args: {
  heroUrl?: string | null
  ogImageUrl?: string | null
  origin: string
  pageUrl: string
}): string {
  const media = resolveOgMediaUrl({
    heroUrl: args.heroUrl,
    ogImageUrl: args.ogImageUrl,
  })
  if (media) return absoluteMediaUrl(args.origin, media)

  return `${stripTrailingSlash(args.pageUrl)}/opengraph-image`
}

/** Safe string for `<script type="application/ld+json">`. */
export function serializeJsonLd(data: JsonLdObject | JsonLdObject[]): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

/**
 * Layout graph: WebSite + Person without repeating `@context` on every node.
 * Google accepts a `@graph` array under one context.
 */
export function buildLocaleShellJsonLd(args: {
  contactEmail?: string | null
  description: string
  locale: AppLocale
  name: string
  origin: string
}): JsonLdObject {
  const website = stripContext(buildWebsiteJsonLd(args))
  const person = stripContext(
    buildPersonJsonLd({
      contactEmail: args.contactEmail,
      locale: args.locale,
      name: args.name,
      origin: args.origin,
    }),
  )

  return {
    '@context': JSON_LD_CONTEXT,
    '@graph': [website, person],
  }
}

function contactEmailFromEnv(raw: string | null | undefined): string | null {
  const mailto = contactMailto(raw)
  if (!mailto) return null
  return mailto.slice('mailto:'.length)
}

function stripContext(node: JsonLdObject): JsonLdObject {
  const { ['@context']: _context, ...rest } = node
  return rest
}

function stripTrailingSlash(origin: string): string {
  return origin.replace(/\/$/, '')
}

function blankToNull(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}
