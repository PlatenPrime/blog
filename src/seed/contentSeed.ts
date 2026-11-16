/**
 * Content seed plan builders (roadmap 102).
 * Pure logic is unit-tested; DB side lives in `src/scripts/seedContent.ts`.
 *
 * Author-only (ADR-007): no readers / comments / bookmarks.
 */

import { Faker, en } from '@faker-js/faker'

import { ABOUT_PAGE_SLUG, PRIVACY_PAGE_SLUG, TERMS_PAGE_SLUG } from '../content/pagesQuery'

/** Marker category slug — presence means content seed already ran. */
export const CONTENT_SEED_MARKER_SLUG = 'seed-demo'

/** Fixed faker seed so demo titles/bodies stay stable for a given faker version. */
export const FAKER_SEED = 102_000

export const CONTENT_SEED_COUNTS = {
  categories: 4,
  tags: 8,
  articles: 12,
  notes: 8,
} as const

export type ContentLocale = 'uk' | 'ru' | 'en'

export const CONTENT_LOCALES: readonly ContentLocale[] = ['uk', 'ru', 'en'] as const

export type LocalizedString = Record<ContentLocale, string>

export type ContentSeedDecision = { action: 'seed' } | { action: 'skip'; reason: string }

export type TaxonomySeedItem = {
  slug: string
  title: LocalizedString
}

export type ContentDocSeedItem = {
  slug: string
  title: LocalizedString
  body: LocalizedString
  categoryIndexes: number[]
  tagIndexes: number[]
}

export type PageSeedItem = {
  slug: typeof ABOUT_PAGE_SLUG | typeof PRIVACY_PAGE_SLUG | typeof TERMS_PAGE_SLUG
  title: LocalizedString
  body: LocalizedString
}

export type ContentSeedPlan = {
  categories: TaxonomySeedItem[]
  tags: TaxonomySeedItem[]
  articles: ContentDocSeedItem[]
  notes: ContentDocSeedItem[]
  pages: PageSeedItem[]
}

/**
 * Idempotent gate: seed only when the marker category is absent.
 */
export function decideContentSeed(args: { markerCategoryExists: boolean }): ContentSeedDecision {
  if (args.markerCategoryExists) {
    return {
      action: 'skip',
      reason: `Marker category slug "${CONTENT_SEED_MARKER_SLUG}" already exists.`,
    }
  }

  return { action: 'seed' }
}

/** Faker instance with a fixed seed for reproducible demo text. */
export function createSeedFaker(seed: number = FAKER_SEED): Faker {
  const faker = new Faker({ locale: [en] })
  faker.seed(seed)
  return faker
}

/** Minimal Lexical document accepted by Articles / Notes / Pages richText. */
export function lexicalParagraph(text: string) {
  return {
    root: {
      type: 'root',
      format: '' as const,
      indent: 0,
      version: 1,
      children: [
        {
          type: 'paragraph',
          format: '' as const,
          indent: 0,
          version: 1,
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal' as const,
              style: '',
              text,
              version: 1,
            },
          ],
          direction: 'ltr' as const,
          textFormat: 0,
          textStyle: '',
        },
      ],
      direction: 'ltr' as const,
    },
  }
}

function localizedFromFaker(
  faker: Faker,
  build: (locale: ContentLocale) => string,
): LocalizedString {
  return {
    uk: build('uk'),
    ru: build('ru'),
    en: build('en'),
  }
}

function pickIndexes(faker: Faker, size: number, maxPick: number): number[] {
  if (size <= 0) return []
  const count = faker.number.int({ min: 1, max: Math.min(maxPick, size) })
  return faker.helpers.arrayElements(
    Array.from({ length: size }, (_, i) => i),
    count,
  )
}

/**
 * Build a full reproducible content plan (no DB).
 * Category / tag / article / note slugs are stable indexes; page slugs match public routes.
 */
export function buildContentSeedPlan(faker: Faker = createSeedFaker()): ContentSeedPlan {
  const categories: TaxonomySeedItem[] = Array.from(
    { length: CONTENT_SEED_COUNTS.categories },
    (_, i) => {
      const slug = i === 0 ? CONTENT_SEED_MARKER_SLUG : `seed-cat-${i + 1}`
      return {
        slug,
        title: localizedFromFaker(faker, (locale) => {
          if (i === 0) {
            const labels: LocalizedString = {
              uk: 'Демо (seed)',
              ru: 'Демо (seed)',
              en: 'Demo (seed)',
            }
            return labels[locale]
          }
          return `${faker.commerce.department()} (${locale})`
        }),
      }
    },
  )

  const tags: TaxonomySeedItem[] = Array.from({ length: CONTENT_SEED_COUNTS.tags }, (_, i) => ({
    slug: `seed-tag-${i + 1}`,
    title: localizedFromFaker(faker, (locale) => `${faker.lorem.word()} (${locale})`),
  }))

  const articles: ContentDocSeedItem[] = Array.from(
    { length: CONTENT_SEED_COUNTS.articles },
    (_, i) => ({
      slug: `seed-article-${i + 1}`,
      title: localizedFromFaker(
        faker,
        (locale) => `${faker.lorem.sentence({ min: 3, max: 6 })} (${locale})`,
      ),
      body: localizedFromFaker(
        faker,
        (locale) => faker.lorem.paragraphs({ min: 2, max: 4 }, '\n\n') + ` [${locale}]`,
      ),
      categoryIndexes: pickIndexes(faker, categories.length, 2),
      tagIndexes: pickIndexes(faker, tags.length, 3),
    }),
  )

  const notes: ContentDocSeedItem[] = Array.from({ length: CONTENT_SEED_COUNTS.notes }, (_, i) => ({
    slug: `seed-note-${i + 1}`,
    title: localizedFromFaker(
      faker,
      (locale) => `${faker.lorem.words({ min: 2, max: 5 })} (${locale})`,
    ),
    body: localizedFromFaker(faker, (locale) => `${faker.lorem.paragraph()} [${locale}]`),
    categoryIndexes: pickIndexes(faker, categories.length, 1),
    tagIndexes: pickIndexes(faker, tags.length, 2),
  }))

  const pages: PageSeedItem[] = [
    {
      slug: ABOUT_PAGE_SLUG,
      title: {
        uk: 'Про автора',
        ru: 'Об авторе',
        en: 'About',
      },
      body: {
        uk: 'Демо-сторінка «про автора» зі seed. Замініть текст у /admin.',
        ru: 'Демо-страница «об авторе» из seed. Замените текст в /admin.',
        en: 'Demo About page from seed. Replace the copy in /admin.',
      },
    },
    {
      slug: PRIVACY_PAGE_SLUG,
      title: {
        uk: 'Політика конфіденційності',
        ru: 'Политика конфиденциальности',
        en: 'Privacy Policy',
      },
      body: {
        uk: 'Демо privacy зі seed. Оновіть перед публічним запуском.',
        ru: 'Демо privacy из seed. Обновите перед публичным запуском.',
        en: 'Demo privacy from seed. Update before a public launch.',
      },
    },
    {
      slug: TERMS_PAGE_SLUG,
      title: {
        uk: 'Умови використання',
        ru: 'Условия использования',
        en: 'Terms of Use',
      },
      body: {
        uk: 'Демо terms зі seed. Оновіть перед публічним запуском.',
        ru: 'Демо terms из seed. Обновите перед публичным запуском.',
        en: 'Demo terms from seed. Update before a public launch.',
      },
    },
  ]

  return { categories, tags, articles, notes, pages }
}
