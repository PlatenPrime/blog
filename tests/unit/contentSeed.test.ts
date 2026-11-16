/** @vitest-environment node */
import { describe, expect, it } from 'vitest'

import {
  CONTENT_SEED_COUNTS,
  CONTENT_SEED_MARKER_SLUG,
  buildContentSeedPlan,
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
  it('is stable (no faker)', () => {
    expect(buildContentSeedPlan()).toEqual(buildContentSeedPlan())
  })

  it('uses marker category, empty feed, and real pages (ADR-007 / step 107)', () => {
    const plan = buildContentSeedPlan()

    expect(plan.categories).toHaveLength(CONTENT_SEED_COUNTS.categories)
    expect(plan.tags).toHaveLength(CONTENT_SEED_COUNTS.tags)
    expect(plan.articles).toHaveLength(CONTENT_SEED_COUNTS.articles)
    expect(plan.notes).toHaveLength(CONTENT_SEED_COUNTS.notes)
    expect(plan.pages.map((page) => page.slug)).toEqual(['about', 'privacy', 'terms'])

    expect(plan.categories[0]?.slug).toBe(CONTENT_SEED_MARKER_SLUG)
    expect(plan.articles).toEqual([])
    expect(plan.notes).toEqual([])

    const demoFragments = [/демо/i, /demo/i, /replace the copy/i, /замініть/i, /замените/i]

    for (const page of plan.pages) {
      expect(page.title.uk).toBeTruthy()
      expect(page.title.ru).toBeTruthy()
      expect(page.title.en).toBeTruthy()
      expect(page.body.uk.length).toBeGreaterThan(80)
      expect(page.body.ru.length).toBeGreaterThan(80)
      expect(page.body.en.length).toBeGreaterThan(80)

      for (const locale of ['uk', 'ru', 'en'] as const) {
        for (const fragment of demoFragments) {
          expect(page.body[locale]).not.toMatch(fragment)
        }
      }
    }
  })

  it('builds Lexical paragraphs accepted by richText fields', () => {
    const single = lexicalParagraph('Hello seed')
    expect(single.root.children).toHaveLength(1)
    expect(single.root.children[0]).toMatchObject({
      type: 'paragraph',
      children: [{ type: 'text', text: 'Hello seed' }],
    })

    const multi = lexicalParagraph('First\n\nSecond')
    expect(multi.root.children).toHaveLength(2)
    expect(multi.root.children[0]).toMatchObject({
      type: 'paragraph',
      children: [{ type: 'text', text: 'First' }],
    })
    expect(multi.root.children[1]).toMatchObject({
      type: 'paragraph',
      children: [{ type: 'text', text: 'Second' }],
    })
  })
})
