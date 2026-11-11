import { hasLocale } from 'next-intl'
import { getTranslations } from 'next-intl/server'

import { getServerUrl } from '@/auth/serverUrl'
import {
  OG_CONTENT_TYPE,
  OG_SIZE,
  brandOgImageResponse,
  contentOgImageResponse,
} from '@/content/ogImageResponse'
import { findPublicPage } from '@/content/pages'
import { PRIVACY_PAGE_SLUG } from '@/content/pagesQuery'
import { routing } from '@/i18n/routing'

export const alt = 'Privacy'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

type Props = {
  params: Promise<{ locale: string }>
}

export default async function PrivacyOpenGraphImage({ params }: Props) {
  const { locale } = await params
  const resolved = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale
  const nav = await getTranslations({ locale: resolved, namespace: 'nav' })
  const siteTitle = nav('siteTitle')

  if (!hasLocale(routing.locales, locale)) {
    return brandOgImageResponse({
      siteDescription: nav('siteDescription'),
      siteTitle,
    })
  }

  const page = await findPublicPage(locale, PRIVACY_PAGE_SLUG)
  if (!page) {
    return brandOgImageResponse({
      siteDescription: nav('siteDescription'),
      siteTitle,
    })
  }

  return contentOgImageResponse({
    ogImageUrl: page.ogImage?.url,
    origin: getServerUrl(),
    siteTitle,
    title: page.metaTitle ?? page.title,
  })
}
