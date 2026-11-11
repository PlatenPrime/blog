import config from '@payload-config'
import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'

import {
  buildSitemapEntries,
  sitemapAboutFindArgs,
  sitemapContentFindArgs,
  sitemapOrigin,
  sitemapPrivacyFindArgs,
  sitemapTaxonomyFindArgs,
  toSitemapSlugDoc,
  type SitemapSlugDoc,
} from '@/content/sitemapQuery'
import { routing, type AppLocale } from '@/i18n/routing'

/** Always reflect the current published set (drafts must not linger after unpublish). */
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload({ config })
  const now = new Date()
  const origin = sitemapOrigin()

  const articlesByLocale: Partial<Record<AppLocale, SitemapSlugDoc[]>> = {}
  const notesByLocale: Partial<Record<AppLocale, SitemapSlugDoc[]>> = {}
  const categoriesByLocale: Partial<Record<AppLocale, SitemapSlugDoc[]>> = {}
  const tagsByLocale: Partial<Record<AppLocale, SitemapSlugDoc[]>> = {}

  for (const locale of routing.locales) {
    const [articles, notes, categories, tags] = await Promise.all([
      payload.find(sitemapContentFindArgs({ collection: 'articles', locale, now })),
      payload.find(sitemapContentFindArgs({ collection: 'notes', locale, now })),
      payload.find(sitemapTaxonomyFindArgs({ collection: 'categories', locale })),
      payload.find(sitemapTaxonomyFindArgs({ collection: 'tags', locale })),
    ])

    articlesByLocale[locale] = articles.docs.flatMap((doc) => {
      const item = toSitemapSlugDoc(doc)
      return item ? [item] : []
    })
    notesByLocale[locale] = notes.docs.flatMap((doc) => {
      const item = toSitemapSlugDoc(doc)
      return item ? [item] : []
    })
    categoriesByLocale[locale] = categories.docs.flatMap((doc) => {
      const item = toSitemapSlugDoc(doc)
      return item ? [item] : []
    })
    tagsByLocale[locale] = tags.docs.flatMap((doc) => {
      const item = toSitemapSlugDoc(doc)
      return item ? [item] : []
    })
  }

  const [about, privacy] = await Promise.all([
    payload.find(sitemapAboutFindArgs({ now })),
    payload.find(sitemapPrivacyFindArgs({ now })),
  ])

  return buildSitemapEntries({
    aboutPublished: about.docs.length > 0,
    articlesByLocale,
    categoriesByLocale,
    notesByLocale,
    origin,
    privacyPublished: privacy.docs.length > 0,
    tagsByLocale,
  })
}
