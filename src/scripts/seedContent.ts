/**
 * CLI: seed go-live baseline content for local onboarding (roadmap 102 → 107).
 *
 *   npm run seed:content
 *
 * Idempotent: skips when marker category `seed-demo` already exists.
 * Seeds marker category + About/Privacy/Terms; no articles/notes (empty-state OK).
 * Does not seed readers / comments / bookmarks (ADR-007).
 * Media / hero images intentionally omitted (no R2 dependency for local seed).
 */
import 'dotenv/config'

import { getPayload, type Payload } from 'payload'

import { logger } from '../lib/logger'
import config from '../payload.config'
import {
  CONTENT_LOCALES,
  CONTENT_SEED_MARKER_SLUG,
  buildContentSeedPlan,
  decideContentSeed,
  lexicalParagraph,
  type ContentDocSeedItem,
  type ContentLocale,
  type LocalizedString,
  type PageSeedItem,
  type TaxonomySeedItem,
} from '../seed/contentSeed'

async function markerExists(payload: Payload): Promise<boolean> {
  const { totalDocs } = await payload.find({
    collection: 'categories',
    where: { slug: { equals: CONTENT_SEED_MARKER_SLUG } },
    locale: 'uk',
    limit: 0,
    overrideAccess: true,
  })
  return totalDocs > 0
}

async function createLocalizedTaxonomy(
  payload: Payload,
  collection: 'categories' | 'tags',
  item: TaxonomySeedItem,
): Promise<number> {
  const created = await payload.create({
    collection,
    locale: 'uk',
    data: {
      title: item.title.uk,
      slug: item.slug,
    },
    overrideAccess: true,
  })

  await updateLocalizedTitleSlug(payload, collection, created.id, item.title, item.slug)
  return created.id
}

async function updateLocalizedTitleSlug(
  payload: Payload,
  collection: 'categories' | 'tags' | 'articles' | 'notes' | 'pages',
  id: number,
  title: LocalizedString,
  slug: string,
  body?: LocalizedString,
): Promise<void> {
  for (const locale of CONTENT_LOCALES) {
    if (locale === 'uk') continue

    await payload.update({
      collection,
      id,
      locale,
      data: {
        title: title[locale],
        slug,
        ...(body ? { body: lexicalParagraph(body[locale]) } : {}),
      },
      overrideAccess: true,
    })
  }
}

async function createLocalizedContentDoc(
  payload: Payload,
  collection: 'articles' | 'notes',
  item: ContentDocSeedItem,
  categoryIds: number[],
  tagIds: number[],
): Promise<void> {
  const categories = item.categoryIndexes
    .map((index) => categoryIds[index])
    .filter((id): id is number => id !== undefined)
  const tags = item.tagIndexes
    .map((index) => tagIds[index])
    .filter((id): id is number => id !== undefined)

  const created = await payload.create({
    collection,
    locale: 'uk' satisfies ContentLocale,
    data: {
      title: item.title.uk,
      slug: item.slug,
      body: lexicalParagraph(item.body.uk),
      _status: 'published',
      publishedAt: new Date().toISOString(),
      categories,
      tags,
    },
    overrideAccess: true,
  })

  await updateLocalizedTitleSlug(payload, collection, created.id, item.title, item.slug, item.body)
}

async function createLocalizedPage(
  payload: Payload,
  item: PageSeedItem,
): Promise<'created' | 'skipped'> {
  const { totalDocs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: item.slug } },
    locale: 'uk',
    limit: 0,
    overrideAccess: true,
  })

  if (totalDocs > 0) {
    return 'skipped'
  }

  const created = await payload.create({
    collection: 'pages',
    locale: 'uk',
    data: {
      title: item.title.uk,
      slug: item.slug,
      body: lexicalParagraph(item.body.uk),
      _status: 'published',
      publishedAt: new Date().toISOString(),
    },
    overrideAccess: true,
  })

  await updateLocalizedTitleSlug(payload, 'pages', created.id, item.title, item.slug, item.body)

  return 'created'
}

async function main(): Promise<void> {
  const payload = await getPayload({ config })
  const decision = decideContentSeed({
    markerCategoryExists: await markerExists(payload),
  })

  if (decision.action === 'skip') {
    payload.logger.info(`seed:content — skip: ${decision.reason}`)
    process.exit(0)
  }

  const plan = buildContentSeedPlan()

  const categoryIds: number[] = []
  for (const category of plan.categories) {
    categoryIds.push(await createLocalizedTaxonomy(payload, 'categories', category))
  }

  const tagIds: number[] = []
  for (const tag of plan.tags) {
    tagIds.push(await createLocalizedTaxonomy(payload, 'tags', tag))
  }

  for (const article of plan.articles) {
    await createLocalizedContentDoc(payload, 'articles', article, categoryIds, tagIds)
  }

  for (const note of plan.notes) {
    await createLocalizedContentDoc(payload, 'notes', note, categoryIds, tagIds)
  }

  let pagesCreated = 0
  let pagesSkipped = 0
  for (const page of plan.pages) {
    const result = await createLocalizedPage(payload, page)
    if (result === 'created') pagesCreated += 1
    else pagesSkipped += 1
  }

  payload.logger.info(
    `seed:content — categories=${plan.categories.length} tags=${plan.tags.length} articles=${plan.articles.length} notes=${plan.notes.length} pages=${pagesCreated} (pages skipped=${pagesSkipped})`,
  )
  process.exit(0)
}

main().catch((error: unknown) => {
  logger.error('seed:content failed', { err: error })
  process.exit(1)
})
