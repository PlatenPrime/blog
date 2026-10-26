import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { NoteList } from '@/components/notes/note-list'
import { EmptyState } from '@/components/states/empty-state'
import { findPublicNotes } from '@/content/notes'
import { notesPageHref, readNotesPageParam } from '@/content/notesQuery'
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
  const nav = await getTranslations({ locale, namespace: 'nav' })

  return {
    title: `${notes('title')} — ${nav('siteTitle')}`,
  }
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
      <div className="mx-auto w-full max-w-measure px-5 pt-16 pb-24 sm:px-6 sm:pt-24">
        <h1 className="m-0 font-sans text-h2 text-foreground">{t('title')}</h1>
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
