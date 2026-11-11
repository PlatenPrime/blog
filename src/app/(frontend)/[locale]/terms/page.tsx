import { hasLocale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PageDetail } from '@/components/pages/page-detail'
import { findPublicPage } from '@/content/pages'
import { TERMS_PAGE_SLUG } from '@/content/pagesQuery'
import { buildPageMetadata } from '@/content/pageMetadata'
import { routing } from '@/i18n/routing'

type TermsPageProps = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: TermsPageProps): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  const page = await findPublicPage(locale, TERMS_PAGE_SLUG)
  if (!page) notFound()

  return buildPageMetadata({
    description: page.metaDescription ?? page.title,
    locale,
    pathname: `/${TERMS_PAGE_SLUG}`,
    title: page.metaTitle ?? page.title,
  })
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  setRequestLocale(locale)
  const page = await findPublicPage(locale, TERMS_PAGE_SLUG)
  if (!page) notFound()

  return (
    <div className="bg-background font-serif text-foreground">
      <div className="mx-auto w-full max-w-measure px-5 pt-16 pb-24 sm:px-6 sm:pt-24">
        <PageDetail labels={{ contact: '' }} mailto={null} page={page} />
      </div>
    </div>
  )
}
