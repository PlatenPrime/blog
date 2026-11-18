import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PageDetail } from '@/components/pages/page-detail'
import { findPublicPage } from '@/content/pages'
import { ABOUT_PAGE_SLUG, contactMailto } from '@/content/pagesQuery'
import { buildPageMetadata } from '@/content/pageMetadata'
import { routing } from '@/i18n/routing'

type AboutPageProps = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  const page = await findPublicPage(locale, ABOUT_PAGE_SLUG)
  if (!page) notFound()

  return buildPageMetadata({
    description: page.metaDescription ?? page.title,
    locale,
    pathname: `/${ABOUT_PAGE_SLUG}`,
    title: page.metaTitle ?? page.title,
  })
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  setRequestLocale(locale)
  const page = await findPublicPage(locale, ABOUT_PAGE_SLUG)
  if (!page) notFound()

  const t = await getTranslations('about')

  return (
    <PageDetail
      labels={{ contact: t('contact') }}
      mailto={contactMailto(process.env.CONTACT_EMAIL)}
      page={page}
    />
  )
}
