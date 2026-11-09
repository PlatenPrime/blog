import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { FeedList } from '@/components/feed/feed-list'
import { SearchForm } from '@/components/search/search-form'
import { EmptyState } from '@/components/states/empty-state'
import { buildPageMetadata, NOINDEX_ROBOTS } from '@/content/pageMetadata'
import { findPublicSearch } from '@/content/search'
import {
  normalizeSearchQuery,
  readSearchPageParam,
  readSearchQueryParam,
  searchPageHref,
} from '@/content/searchQuery'
import { redirect } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

type SearchPageProps = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string | string[]; q?: string | string[] }>
}

export async function generateMetadata({
  params,
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { locale: requested } = await params
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale
  const search = await getTranslations({ locale, namespace: 'search' })
  const { q: rawQuery } = await searchParams
  const query = normalizeSearchQuery(rawQuery)

  return buildPageMetadata({
    description: search('metaDescription'),
    locale,
    pathname: '/search',
    ...(query ? { robots: NOINDEX_ROBOTS } : {}),
    title: search('title'),
  })
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  setRequestLocale(locale)
  const { page: rawPage, q: rawQuery } = await searchParams
  const result = await findPublicSearch(
    locale,
    readSearchQueryParam(rawQuery),
    readSearchPageParam(rawPage),
  )

  if (result.kind === 'redirect') {
    redirect({
      href:
        result.page === null ? searchPageHref(result.q, 1) : searchPageHref(result.q, result.page),
      locale,
    })
    return
  }

  const t = await getTranslations('search')
  const feed = await getTranslations('feed')
  const formQuery = result.kind === 'render' ? result.q : ''

  return (
    <div className="bg-background font-serif text-foreground">
      <div className="mx-auto w-full max-w-measure px-5 pt-16 pb-24 sm:px-6 sm:pt-24">
        <h1 className="m-0 font-serif text-h1 text-foreground">{t('title')}</h1>
        <SearchForm
          defaultQuery={formQuery}
          labels={{
            placeholder: t('placeholder'),
            submit: t('submit'),
          }}
        />
        {result.kind === 'empty-query' ? (
          <p className="mt-14 mb-0 font-sans text-body text-muted-foreground" role="status">
            {t('emptyQuery')}
          </p>
        ) : result.items.length === 0 ? (
          <EmptyState>{t('noResults')}</EmptyState>
        ) : (
          <FeedList
            items={result.items}
            labels={{
              article: feed('article'),
              next: t('next'),
              note: feed('note'),
              pageStatus: t('pageStatus', { page: result.page, pages: result.pageCount }),
              pagination: t('pagination'),
              previous: t('previous'),
            }}
            locale={locale}
            page={result.page}
            pageCount={result.pageCount}
            pageHref={(page) => searchPageHref(result.q, page)}
          />
        )}
      </div>
    </div>
  )
}
