import { getPayload, type Payload } from 'payload'

import config from '@/payload.config'

import { beforeAll, describe, expect, it } from 'vitest'

import { createTestArticle, lexicalParagraph, uniqueSuffix } from '../helpers/factories'

let payload: Payload

describe('Content localization (Local API)', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('stores and returns distinct uk/ru/en titles on one article', async () => {
    const suffix = uniqueSuffix()
    const slug = `locale-triptych-${suffix}`

    const created = await createTestArticle(payload, {
      locale: 'uk',
      title: `Заголовок UK ${suffix}`,
      slug,
      body: lexicalParagraph(`Тіло UK ${suffix}`),
      _status: 'published',
    })

    await payload.update({
      collection: 'articles',
      id: created.id,
      locale: 'ru',
      data: {
        title: `Заголовок RU ${suffix}`,
        slug,
        body: lexicalParagraph(`Тело RU ${suffix}`),
      },
      overrideAccess: true,
    })

    await payload.update({
      collection: 'articles',
      id: created.id,
      locale: 'en',
      data: {
        title: `Title EN ${suffix}`,
        slug,
        body: lexicalParagraph(`Body EN ${suffix}`),
      },
      overrideAccess: true,
    })

    const byLocale = async (locale: 'uk' | 'ru' | 'en') => {
      const { docs } = await payload.find({
        collection: 'articles',
        where: { slug: { equals: slug } },
        locale,
        limit: 1,
        overrideAccess: true,
      })
      return docs[0]
    }

    const uk = await byLocale('uk')
    const ru = await byLocale('ru')
    const en = await byLocale('en')

    expect(uk?.title).toBe(`Заголовок UK ${suffix}`)
    expect(ru?.title).toBe(`Заголовок RU ${suffix}`)
    expect(en?.title).toBe(`Title EN ${suffix}`)
    expect(uk?.id).toBe(created.id)
    expect(ru?.id).toBe(created.id)
    expect(en?.id).toBe(created.id)
  })

  it('falls back to uk when the requested locale has no title', async () => {
    const suffix = uniqueSuffix()
    const slug = `locale-fallback-${suffix}`
    const ukTitle = `Тільки UK ${suffix}`

    const created = await createTestArticle(payload, {
      locale: 'uk',
      title: ukTitle,
      slug,
      body: lexicalParagraph(`Тіло UK ${suffix}`),
      _status: 'published',
    })

    // findByID: slug is localized; only `uk` has a row, so filter-by-slug on `en` is unreliable.
    const withFallback = await payload.findByID({
      collection: 'articles',
      id: created.id,
      locale: 'en',
      // Config has fallback: true; explicit here so the contract is visible in the test.
      fallbackLocale: 'uk',
      overrideAccess: true,
    })

    expect(withFallback.title).toBe(ukTitle)

    const withoutFallback = await payload.findByID({
      collection: 'articles',
      id: created.id,
      locale: 'en',
      fallbackLocale: false,
      overrideAccess: true,
    })

    // No en locale row: without fallback the localized title is absent.
    expect(withoutFallback.title == null || withoutFallback.title === '').toBe(true)
  })
})
