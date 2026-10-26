import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { FeedList } from '@/components/feed/feed-list'
import { findPublicFeed } from '@/content/feed'
import { feedPageHref, readFeedPageParam } from '@/content/feedQuery'
import { redirect } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

type FeedPageProps = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string | string[] }>
}

export async function generateMetadata({ params }: FeedPageProps): Promise<Metadata> {
  const { locale: requested } = await params
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale
  const feed = await getTranslations({ locale, namespace: 'feed' })
  const nav = await getTranslations({ locale, namespace: 'nav' })

  return {
    title: `${feed('title')} — ${nav('siteTitle')}`,
  }
}

export default async function FeedPage({ params, searchParams }: FeedPageProps) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  setRequestLocale(locale)
  const { page: rawPage } = await searchParams
  const result = await findPublicFeed(locale, readFeedPageParam(rawPage))

  if (result.kind === 'redirect') {
    redirect({
      href: result.page === null ? '/feed' : feedPageHref(result.page),
      locale,
    })
    // `redirect` ends the response. Returning narrows `result` for the checker.
    return
  }

  const t = await getTranslations('feed')

  return (
    <div className="bg-background font-serif text-foreground">
      <div className="mx-auto w-full max-w-measure px-5 pt-16 pb-24 sm:px-6 sm:pt-24">
        <h1 className="m-0 font-serif text-h1 text-foreground">{t('title')}</h1>
        {result.items.length === 0 ? (
          <p className="mt-14 mb-0 text-body text-muted-foreground">{t('empty')}</p>
        ) : (
          <FeedList
            items={result.items}
            labels={{
              article: t('article'),
              next: t('next'),
              note: t('note'),
              pageStatus: t('pageStatus', { page: result.page, pages: result.pageCount }),
              pagination: t('pagination'),
              previous: t('previous'),
            }}
            locale={locale}
            page={result.page}
            pageCount={result.pageCount}
          />
        )}
      </div>
    </div>
  )
}
