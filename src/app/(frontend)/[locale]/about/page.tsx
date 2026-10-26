import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PageDetail } from '@/components/pages/page-detail'
import { findPublicPage } from '@/content/pages'
import { ABOUT_PAGE_SLUG, contactMailto } from '@/content/pagesQuery'
import { routing } from '@/i18n/routing'

type AboutPageProps = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  const page = await findPublicPage(locale, ABOUT_PAGE_SLUG)
  if (!page) notFound()

  const nav = await getTranslations({ locale, namespace: 'nav' })
  const title = `${page.metaTitle ?? page.title} — ${nav('siteTitle')}`

  if (!page.metaDescription) return { title }
  return { description: page.metaDescription, title }
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  setRequestLocale(locale)
  const page = await findPublicPage(locale, ABOUT_PAGE_SLUG)
  if (!page) notFound()

  const t = await getTranslations('about')

  return (
    <div className="bg-background font-serif text-foreground">
      <div className="mx-auto w-full max-w-measure px-5 pt-16 pb-24 sm:px-6 sm:pt-24">
        <PageDetail
          labels={{ contact: t('contact') }}
          mailto={contactMailto(process.env.CONTACT_EMAIL)}
          page={page}
        />
      </div>
    </div>
  )
}
