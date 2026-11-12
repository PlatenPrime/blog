import config from '@payload-config'
import { cache } from 'react'
import { getPayload } from 'payload'

import { getServerUrl } from '@/lib/serverUrl'
import {
  languageAlternatesFromSlugs,
  localizedContentSlugFindArgs,
  localizedTaxonomySlugFindArgs,
  slugFromLocalizedDoc,
  type LocalizedSlugSegment,
} from '@/content/pageMetadata'
import { routing, type AppLocale } from '@/i18n/routing'

type ContentCollection = 'articles' | 'notes'
type TaxonomyCollection = 'categories' | 'tags'

/**
 * hreflang map for one published article or note across locales that still expose a slug.
 */
export const findContentLanguageAlternates = cache(
  async (collection: ContentCollection, id: number): Promise<Record<string, string>> => {
    const origin = getServerUrl()
    const payload = await getPayload({ config })
    const now = new Date()
    const slugsByLocale: Partial<Record<AppLocale, string>> = {}

    await Promise.all(
      routing.locales.map(async (locale) => {
        const found = await payload.find(
          localizedContentSlugFindArgs({ collection, id, locale, now }),
        )
        const slug = slugFromLocalizedDoc(found.docs[0])
        if (slug) slugsByLocale[locale] = slug
      }),
    )

    return languageAlternatesFromSlugs(origin, collection, slugsByLocale)
  },
)

/**
 * hreflang map for one category or tag shelf across locales that still expose a slug.
 */
export const findTaxonomyLanguageAlternates = cache(
  async (collection: TaxonomyCollection, id: number): Promise<Record<string, string>> => {
    const origin = getServerUrl()
    const payload = await getPayload({ config })
    const slugsByLocale: Partial<Record<AppLocale, string>> = {}

    await Promise.all(
      routing.locales.map(async (locale) => {
        const found = await payload.find(localizedTaxonomySlugFindArgs({ collection, id, locale }))
        const slug = slugFromLocalizedDoc(found.docs[0])
        if (slug) slugsByLocale[locale] = slug
      }),
    )

    return languageAlternatesFromSlugs(origin, collection as LocalizedSlugSegment, slugsByLocale)
  },
)
