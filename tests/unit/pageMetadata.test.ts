/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import {
  buildPageMetadata,
  languageAlternatesFromSlugs,
  localeTitleTemplate,
  localizedContentSlugFindArgs,
  localizedTaxonomySlugFindArgs,
  NOINDEX_ROBOTS,
  slugFromLocalizedDoc,
} from '@/content/pageMetadata'

const origin = 'https://blog.example'

describe('localeTitleTemplate', () => {
  it('keeps a bare default and a segment template', () => {
    expect(localeTitleTemplate('PlatenPrime')).toEqual({
      default: 'PlatenPrime',
      template: '%s — PlatenPrime',
    })
  })
})

describe('languageAlternatesFromSlugs', () => {
  it('builds locale urls and x-default from uk when present', () => {
    const languages = languageAlternatesFromSlugs(origin, 'articles', {
      en: 'hello',
      ru: 'privet',
      uk: 'pryvit',
    })

    expect(languages.uk).toBe('https://blog.example/uk/articles/pryvit')
    expect(languages.ru).toBe('https://blog.example/ru/articles/privet')
    expect(languages.en).toBe('https://blog.example/en/articles/hello')
    expect(languages['x-default']).toBe('https://blog.example/uk/articles/pryvit')
  })

  it('skips missing locales and still sets x-default', () => {
    const languages = languageAlternatesFromSlugs(origin, 'notes', {
      en: 'only-en',
    })

    expect(languages.uk).toBeUndefined()
    expect(languages.en).toBe('https://blog.example/en/notes/only-en')
    expect(languages['x-default']).toBe('https://blog.example/en/notes/only-en')
  })
})

describe('buildPageMetadata', () => {
  it('emits absolute canonical without a query string and shared-path languages', () => {
    const metadata = buildPageMetadata({
      description: 'Feed blurb',
      locale: 'uk',
      origin,
      pathname: '/feed',
      title: 'Feed',
    })

    expect(metadata.title).toBe('Feed')
    expect(metadata.description).toBe('Feed blurb')
    expect(metadata.alternates?.canonical).toBe('https://blog.example/uk/feed')
    expect(metadata.alternates?.languages).toEqual({
      en: 'https://blog.example/en/feed',
      ru: 'https://blog.example/ru/feed',
      uk: 'https://blog.example/uk/feed',
      'x-default': 'https://blog.example/uk/feed',
    })
  })

  it('supports absolute titles, robots, custom languages, and RSS types', () => {
    const metadata = buildPageMetadata({
      absoluteTitle: true,
      languages: {
        uk: 'https://blog.example/uk/articles/a',
        'x-default': 'https://blog.example/uk/articles/a',
      },
      locale: 'uk',
      origin,
      pathname: '/articles/a',
      robots: NOINDEX_ROBOTS,
      title: 'PlatenPrime',
      types: { 'application/rss+xml': 'https://blog.example/uk/rss.xml' },
    })

    expect(metadata.title).toEqual({ absolute: 'PlatenPrime' })
    expect(metadata.robots).toEqual(NOINDEX_ROBOTS)
    expect(metadata.alternates?.canonical).toBe('https://blog.example/uk/articles/a')
    expect(metadata.alternates?.languages).toEqual({
      uk: 'https://blog.example/uk/articles/a',
      'x-default': 'https://blog.example/uk/articles/a',
    })
    expect(metadata.alternates?.types).toEqual({
      'application/rss+xml': 'https://blog.example/uk/rss.xml',
    })
  })
})

describe('localized slug find args', () => {
  it('locks content finds to the document id and public visibility', () => {
    const args = localizedContentSlugFindArgs({ collection: 'articles', id: 7, locale: 'ru' })

    expect(args.collection).toBe('articles')
    expect(args.draft).toBe(false)
    expect(args.fallbackLocale).toBe(false)
    expect(args.locale).toBe('ru')
    expect(args.where).toEqual({
      and: [{ id: { equals: 7 } }, expect.objectContaining({ and: expect.any(Array) })],
    })
  })

  it('finds taxonomy siblings by id without a draft flag', () => {
    const args = localizedTaxonomySlugFindArgs({ collection: 'tags', id: 3, locale: 'en' })

    expect(args.collection).toBe('tags')
    expect(args.fallbackLocale).toBe(false)
    expect(args.where).toEqual({ id: { equals: 3 } })
    expect(args).not.toHaveProperty('draft')
  })
})

describe('slugFromLocalizedDoc', () => {
  it('rejects blank and missing slugs', () => {
    expect(slugFromLocalizedDoc(undefined)).toBeNull()
    expect(slugFromLocalizedDoc({ slug: '' })).toBeNull()
    expect(slugFromLocalizedDoc({ slug: 'ok' })).toBe('ok')
  })
})
