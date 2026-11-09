import { hasLocale } from 'next-intl'
import { getTranslations } from 'next-intl/server'

import { OG_CONTENT_TYPE, OG_SIZE, brandOgImageResponse } from '@/content/ogImageResponse'
import { routing } from '@/i18n/routing'

export const alt = 'PlatenPrime'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

type Props = {
  params: Promise<{ locale: string }>
}

export default async function LocaleOpenGraphImage({ params }: Props) {
  const { locale } = await params
  const resolved = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale
  const t = await getTranslations({ locale: resolved, namespace: 'nav' })

  return brandOgImageResponse({
    siteDescription: t('siteDescription'),
    siteTitle: t('siteTitle'),
  })
}
