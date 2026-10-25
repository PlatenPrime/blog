import { getPayload, type Payload } from 'payload'
import type { Article } from '@/payload-types'
import config from '@/payload.config'

import { beforeAll, describe, expect, it } from 'vitest'

/** Minimal Lexical document accepted by Articles richText. */
const lexicalParagraph = (text: string): Article['body'] => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    children: [
      {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        children: [
          {
            type: 'text',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text,
            version: 1,
          },
        ],
        direction: 'ltr',
        textFormat: 0,
        textStyle: '',
      },
    ],
    direction: 'ltr',
  },
})

let payload: Payload

describe('Content localization (Local API)', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('stores and returns distinct uk/ru/en titles on one article', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const slug = `locale-triptych-${suffix}`

    const created = await payload.create({
      collection: 'articles',
      locale: 'uk',
      data: {
        title: `Заголовок UK ${suffix}`,
        slug,
        body: lexicalParagraph(`Тіло UK ${suffix}`),
        _status: 'published',
      },
      overrideAccess: true,
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
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const slug = `locale-fallback-${suffix}`
    const ukTitle = `Тільки UK ${suffix}`

    const created = await payload.create({
      collection: 'articles',
      locale: 'uk',
      data: {
        title: ukTitle,
        slug,
        body: lexicalParagraph(`Тіло UK ${suffix}`),
        _status: 'published',
      },
      overrideAccess: true,
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
