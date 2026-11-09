import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getServerUrl } from '@/auth/serverUrl'
import { BookmarkControl } from '@/components/bookmarks/bookmark-control'
import { CommentSection } from '@/components/comments/comment-section'
import { NoteDetail } from '@/components/notes/note-detail'
import { RelatedContent } from '@/components/reading/related-content'
import { JsonLd } from '@/components/seo/json-ld'
import { buildArticleJsonLd } from '@/content/jsonLd'
import { findContentLanguageAlternates } from '@/content/localizedAlternates'
import { findPublicNote } from '@/content/notes'
import { buildPageMetadata } from '@/content/pageMetadata'
import { findRelatedContent } from '@/content/relatedContent'
import { rssExcerpt } from '@/content/rssQuery'
import { routing } from '@/i18n/routing'

type NotePageProps = {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: NotePageProps): Promise<Metadata> {
  const { locale, slug } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  const note = await findPublicNote(locale, slug)
  if (!note) notFound()

  const languages = await findContentLanguageAlternates('notes', note.id)

  return buildPageMetadata({
    description: rssExcerpt({
      metaDescription: note.metaDescription,
      searchText: note.searchText,
    }),
    languages,
    locale,
    pathname: `/notes/${slug}`,
    title: note.metaTitle ?? note.title,
  })
}

export default async function NotePage({ params }: NotePageProps) {
  const { locale, slug } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  setRequestLocale(locale)
  const note = await findPublicNote(locale, slug)
  if (!note) notFound()

  const [t, feed, related] = await Promise.all([
    getTranslations('notes'),
    getTranslations('feed'),
    findRelatedContent({
      categoryIds: note.categoryIds,
      excludeCollection: 'notes',
      excludeId: note.id,
      locale,
      tagIds: note.tagIds,
    }),
  ])

  const jsonLd = buildArticleJsonLd({
    description: note.metaDescription,
    locale,
    ogImageUrl: note.ogImage?.url,
    origin: getServerUrl(),
    pathname: `/notes/${slug}`,
    publishedAt: note.publishedAt,
    title: note.title,
  })

  return (
    <div className="bg-background font-sans text-foreground">
      <JsonLd data={jsonLd} />
      <div className="mx-auto w-full max-w-measure px-5 pt-16 pb-24 sm:px-6 sm:pt-24">
        <NoteDetail
          labels={{
            categories: t('categories'),
            kicker: t('kicker'),
            tableOfContents: t('tableOfContents'),
            tags: t('tags'),
          }}
          locale={locale}
          note={note}
        />
        {related.length > 0 ? (
          <RelatedContent
            items={related}
            labels={{
              article: feed('article'),
              heading: t('related'),
              note: feed('note'),
            }}
            locale={locale}
          />
        ) : null}
        <BookmarkControl contentId={note.id} relationTo="notes" />
        <CommentSection contentId={note.id} locale={locale} relationTo="notes" />
      </div>
    </div>
  )
}
