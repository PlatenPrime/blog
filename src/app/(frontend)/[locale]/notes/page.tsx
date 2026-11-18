import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { listColumnClassName } from '@/components/content/content-row'
import { NoteList } from '@/components/notes/note-list'
import { EmptyState } from '@/components/states/empty-state'
import { findPublicNotes } from '@/content/notes'
import { notesPageHref, readNotesPageParam } from '@/content/notesQuery'
import { buildPageMetadata } from '@/content/pageMetadata'
import { absoluteRssFeedUrl, rssOrigin } from '@/content/rssQuery'
import { redirect } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

type NotesPageProps = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string | string[] }>
}

export async function generateMetadata({ params }: NotesPageProps): Promise<Metadata> {
  const { locale: requested } = await params
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale
  const notes = await getTranslations({ locale, namespace: 'notes' })

  return buildPageMetadata({
    description: notes('metaDescription'),
    locale,
    pathname: '/notes',
    title: notes('title'),
    types: {
      'application/rss+xml': absoluteRssFeedUrl(rssOrigin(), locale, 'notes'),
    },
  })
}

export default async function NotesPage({ params, searchParams }: NotesPageProps) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  setRequestLocale(locale)
  const { page: rawPage } = await searchParams
  const result = await findPublicNotes(locale, readNotesPageParam(rawPage))

  if (result.kind === 'redirect') {
    redirect({
      href: result.page === null ? '/notes' : notesPageHref(result.page),
      locale,
    })
    // `redirect` ends the response. Returning narrows `result` for the checker.
    return
  }

  const t = await getTranslations('notes')

  return (
    <div className="bg-background font-sans text-foreground">
      <div className={listColumnClassName}>
        <h1 className="m-0 font-sans text-h1 text-foreground">{t('title')}</h1>
        {result.items.length === 0 ? (
          <EmptyState>{t('empty')}</EmptyState>
        ) : (
          <NoteList
            items={result.items}
            labels={{
              next: t('next'),
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
