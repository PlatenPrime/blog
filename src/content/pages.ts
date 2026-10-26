import config from '@payload-config'
import { cache } from 'react'
import { getPayload } from 'payload'

import { pageDetailFindArgs, publicPageForLocale, type PublicPage } from '@/content/pagesQuery'
import { resolveContentLocale } from '@/i18n/contentLocale'

/**
 * One published CMS page, or null when the slug is missing, draft, or still scheduled.
 * Shared by the page and its metadata so one request does not ask twice.
 * Does not receive the session user and does not open draft mode.
 *
 * `where` on a localized slug does not see the fallback locale. An empty `en` slug
 * would miss `/en/about` even though the Ukrainian slug is `about`. When the
 * requested locale misses, read the Ukrainian document by id and let
 * `fallbackLocale` fill the empty fields. A locale that chose a different slug
 * stays off this path.
 */
export const findPublicPage = cache(
  async (locale: string, slug: string): Promise<PublicPage | null> => {
    const payload = await getPayload({ config })
    const contentLocale = resolveContentLocale(locale)
    const args = pageDetailFindArgs({ locale: contentLocale, slug })
    const found = await payload.find(args)
    const direct = found.docs[0]
    if (direct) return publicPageForLocale(direct, slug)
    if (contentLocale === 'uk') return null

    const fallback = await payload.find(pageDetailFindArgs({ locale: 'uk', slug }))
    const base = fallback.docs[0]
    if (!base) return null

    const localized = await payload.findByID({
      collection: 'pages',
      id: base.id,
      depth: args.depth,
      draft: false,
      fallbackLocale: 'uk',
      locale: contentLocale,
      overrideAccess: false,
      select: args.select,
    })

    return publicPageForLocale(localized, slug)
  },
)
