import { hasLocale } from 'next-intl'
import { getTranslations } from 'next-intl/server'

import { getServerUrl } from '@/lib/serverUrl'
import { findPublicNote } from '@/content/notes'
import {
  OG_CONTENT_TYPE,
  OG_SIZE,
  brandOgImageResponse,
  contentOgImageResponse,
} from '@/content/ogImageResponse'
import { routing } from '@/i18n/routing'

export const alt = 'Note'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export default async function NoteOpenGraphImage({ params }: Props) {
  const { locale, slug } = await params
  const resolved = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale
  const nav = await getTranslations({ locale: resolved, namespace: 'nav' })
  const siteTitle = nav('siteTitle')

  if (!hasLocale(routing.locales, locale)) {
    return brandOgImageResponse({
      siteDescription: nav('siteDescription'),
      siteTitle,
    })
  }

  const note = await findPublicNote(locale, slug)
  if (!note) {
    return brandOgImageResponse({
      siteDescription: nav('siteDescription'),
      siteTitle,
    })
  }

  return contentOgImageResponse({
    ogImageUrl: note.ogImage?.url,
    origin: getServerUrl(),
    siteTitle,
    title: note.metaTitle ?? note.title,
  })
}
