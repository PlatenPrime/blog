import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { FeedList } from '@/components/feed/feed-list'
import {
  findPublicTaxonomyFeed,
  findPublicTaxonomyIndex,
  findPublicTaxonomyTerm,
} from '@/content/taxonomy'
import {
  readTaxonomyPageParam,
  taxonomyTermHref,
  taxonomyTermPath,
  type TaxonomyCollection,
  type TaxonomyTerm,
} from '@/content/taxonomyQuery'
import { Link, redirect } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

const columnClassName = 'mx-auto w-full max-w-measure px-5 pt-16 pb-24 sm:px-6 sm:pt-24'

type IndexPageProps = {
  params: Promise<{ locale: string }>
}

type TermPageProps = {
  params: Promise<{ locale: string; slug: string }>
  searchParams: Promise<{ page?: string | string[] }>
}

function titleKey(collection: TaxonomyCollection): 'categoriesTitle' | 'tagsTitle' {
  return collection === 'categories' ? 'categoriesTitle' : 'tagsTitle'
}

export async function taxonomyIndexMetadata(
  collection: TaxonomyCollection,
  params: IndexPageProps['params'],
): Promise<Metadata> {
  const { locale: requested } = await params
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale
  const taxonomy = await getTranslations({ locale, namespace: 'taxonomy' })
  const nav = await getTranslations({ locale, namespace: 'nav' })

  return {
    title: `${taxonomy(titleKey(collection))} — ${nav('siteTitle')}`,
  }
}

export async function taxonomyTermMetadata(
  collection: TaxonomyCollection,
  params: TermPageProps['params'],
): Promise<Metadata> {
  const { locale, slug } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  const term = await findPublicTaxonomyTerm(collection, locale, slug)
  if (!term) notFound()

  const nav = await getTranslations({ locale, namespace: 'nav' })
  return { title: `${term.title} — ${nav('siteTitle')}` }
}

/**
 * Index of one taxonomy. The other shelf is a link on the page:
 * tags stay out of the header, whose paths were fixed with the chrome.
 */
export async function TaxonomyIndexPage({
  collection,
  params,
}: {
  collection: TaxonomyCollection
  params: IndexPageProps['params']
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  setRequestLocale(locale)
  const t = await getTranslations('taxonomy')
  const terms = await findPublicTaxonomyIndex(collection, locale)
  const sibling = collection === 'categories' ? 'tags' : 'categories'

  return (
    <div className="bg-background font-serif text-foreground">
      <div className={columnClassName}>
        <h1 className="m-0 font-serif text-h1 text-foreground">{t(titleKey(collection))}</h1>
        <p className="mt-6 mb-0 font-sans text-small">
          <Link className="text-primary underline-offset-4 hover:underline" href={`/${sibling}`}>
            {t(titleKey(sibling))}
          </Link>
        </p>
        {terms.length === 0 ? (
          <p className="mt-14 mb-0 text-body text-muted-foreground">{t('empty')}</p>
        ) : (
          <TaxonomyIndexList collection={collection} terms={terms} />
        )}
      </div>
    </div>
  )
}

/**
 * One shelf as a mixed feed. An unknown slug is the localized 404.
 * A shelf with no published texts keeps its title and one empty line.
 */
export async function TaxonomyTermPage({
  collection,
  params,
  searchParams,
}: {
  collection: TaxonomyCollection
  params: TermPageProps['params']
  searchParams: TermPageProps['searchParams']
}) {
  const { locale, slug } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  setRequestLocale(locale)
  const { page: rawPage } = await searchParams
  const result = await findPublicTaxonomyFeed(
    collection,
    locale,
    slug,
    readTaxonomyPageParam(rawPage),
  )

  if (result.kind === 'missing') notFound()

  if (result.kind === 'redirect') {
    redirect({
      href:
        result.page === null
          ? taxonomyTermPath(collection, slug)
          : taxonomyTermHref(collection, slug, result.page),
      locale,
    })
    return
  }

  const t = await getTranslations('taxonomy')

  return (
    <div className="bg-background font-serif text-foreground">
      <div className={columnClassName}>
        <h1 className="m-0 font-serif text-h1 text-foreground">{result.title}</h1>
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
            pageHref={(page) => taxonomyTermHref(collection, slug, page)}
          />
        )}
      </div>
    </div>
  )
}

function TaxonomyIndexList({
  collection,
  terms,
}: {
  collection: TaxonomyCollection
  terms: readonly TaxonomyTerm[]
}) {
  return (
    <ul className="m-0 mt-10 list-none p-0">
      {terms.map((term) => (
        <li className="border-b border-border py-5" key={term.id}>
          <Link
            className="font-serif text-h3 text-foreground underline-offset-4 hover:underline"
            href={taxonomyTermPath(collection, term.slug)}
          >
            {term.title}
          </Link>
        </li>
      ))}
    </ul>
  )
}
