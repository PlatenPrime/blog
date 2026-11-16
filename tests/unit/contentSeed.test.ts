/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import {
  CONTENT_SEED_COUNTS,
  CONTENT_SEED_MARKER_SLUG,
  FAKER_SEED,
  buildContentSeedPlan,
  createSeedFaker,
  decideContentSeed,
  lexicalParagraph,
} from '@/seed/contentSeed'

describe('decideContentSeed', () => {
  it('seeds when marker category is absent', () => {
    expect(decideContentSeed({ markerCategoryExists: false })).toEqual({ action: 'seed' })
  })

  it('skips when marker category already exists', () => {
    expect(decideContentSeed({ markerCategoryExists: true })).toMatchObject({
      action: 'skip',
      reason: expect.stringContaining(CONTENT_SEED_MARKER_SLUG),
    })
  })
})

describe('buildContentSeedPlan', () => {
  it('is reproducible for a fixed faker seed', () => {
    const a = buildContentSeedPlan(createSeedFaker(FAKER_SEED))
    const b = buildContentSeedPlan(createSeedFaker(FAKER_SEED))
    expect(a).toEqual(b)
  })

  it('uses stable slugs and expected counts (ADR-007: no social layer)', () => {
    const plan = buildContentSeedPlan(createSeedFaker())

    expect(plan.categories).toHaveLength(CONTENT_SEED_COUNTS.categories)
    expect(plan.tags).toHaveLength(CONTENT_SEED_COUNTS.tags)
    expect(plan.articles).toHaveLength(CONTENT_SEED_COUNTS.articles)
    expect(plan.notes).toHaveLength(CONTENT_SEED_COUNTS.notes)
    expect(plan.pages.map((page) => page.slug)).toEqual(['about', 'privacy', 'terms'])

    expect(plan.categories[0]?.slug).toBe(CONTENT_SEED_MARKER_SLUG)
    expect(plan.articles.map((doc) => doc.slug)).toEqual(
      Array.from({ length: CONTENT_SEED_COUNTS.articles }, (_, i) => `seed-article-${i + 1}`),
    )
    expect(plan.notes.map((doc) => doc.slug)).toEqual(
      Array.from({ length: CONTENT_SEED_COUNTS.notes }, (_, i) => `seed-note-${i + 1}`),
    )

    for (const article of plan.articles) {
      expect(article.categoryIndexes.length).toBeGreaterThan(0)
      expect(article.tagIndexes.length).toBeGreaterThan(0)
      expect(article.title.uk).toBeTruthy()
      expect(article.title.ru).toBeTruthy()
      expect(article.title.en).toBeTruthy()
    }
  })

  it('builds Lexical paragraphs accepted by richText fields', () => {
    const doc = lexicalParagraph('Hello seed')
    expect(doc.root.children[0]).toMatchObject({
      type: 'paragraph',
      children: [{ type: 'text', text: 'Hello seed' }],
    })
  })
})
