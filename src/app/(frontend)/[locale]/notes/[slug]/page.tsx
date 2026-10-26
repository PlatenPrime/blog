import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { BookmarkControl } from '@/components/bookmarks/bookmark-control'
import { CommentSection } from '@/components/comments/comment-section'
import { NoteDetail } from '@/components/notes/note-detail'
import { findPublicNote } from '@/content/notes'
import { routing } from '@/i18n/routing'

type NotePageProps = {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: NotePageProps): Promise<Metadata> {
  const { locale, slug } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  const note = await findPublicNote(locale, slug)
  if (!note) notFound()

  const nav = await getTranslations({ locale, namespace: 'nav' })
  const title = `${note.metaTitle ?? note.title} — ${nav('siteTitle')}`

  if (!note.metaDescription) return { title }
  return { description: note.metaDescription, title }
}

export default async function NotePage({ params }: NotePageProps) {
  const { locale, slug } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  setRequestLocale(locale)
  const note = await findPublicNote(locale, slug)
  if (!note) notFound()

  const t = await getTranslations('notes')

  return (
    <div className="bg-background font-sans text-foreground">
      <div className="mx-auto w-full max-w-measure px-5 pt-16 pb-24 sm:px-6 sm:pt-24">
        <NoteDetail
          labels={{ categories: t('categories'), kicker: t('kicker'), tags: t('tags') }}
          locale={locale}
          note={note}
        />
        <BookmarkControl contentId={note.id} relationTo="notes" />
        <CommentSection contentId={note.id} locale={locale} relationTo="notes" />
      </div>
    </div>
  )
}
