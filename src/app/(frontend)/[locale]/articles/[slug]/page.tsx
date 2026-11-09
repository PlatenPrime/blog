import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getServerUrl } from '@/auth/serverUrl'
import { ArticleDetail } from '@/components/articles/article-detail'
import { BookmarkControl } from '@/components/bookmarks/bookmark-control'
import { CommentSection } from '@/components/comments/comment-section'
import { RelatedContent } from '@/components/reading/related-content'
import { JsonLd } from '@/components/seo/json-ld'
import { findPublicArticle } from '@/content/articles'
import { buildArticleJsonLd } from '@/content/jsonLd'
import { findRelatedContent } from '@/content/relatedContent'
import { routing } from '@/i18n/routing'

type ArticlePageProps = {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { locale, slug } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  const article = await findPublicArticle(locale, slug)
  if (!article) notFound()

  const nav = await getTranslations({ locale, namespace: 'nav' })
  const title = `${article.metaTitle ?? article.title} — ${nav('siteTitle')}`

  if (!article.metaDescription) return { title }
  return { description: article.metaDescription, title }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { locale, slug } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  setRequestLocale(locale)
  const article = await findPublicArticle(locale, slug)
  if (!article) notFound()

  const [t, feed, related] = await Promise.all([
    getTranslations('articles'),
    getTranslations('feed'),
    findRelatedContent({
      categoryIds: article.categoryIds,
      excludeCollection: 'articles',
      excludeId: article.id,
      locale,
      tagIds: article.tagIds,
    }),
  ])

  const jsonLd = buildArticleJsonLd({
    description: article.metaDescription,
    heroUrl: article.hero?.url,
    locale,
    ogImageUrl: article.ogImage?.url,
    origin: getServerUrl(),
    pathname: `/articles/${slug}`,
    publishedAt: article.publishedAt,
    title: article.title,
  })

  return (
    <div className="bg-background font-serif text-foreground">
      <JsonLd data={jsonLd} />
      <div className="mx-auto w-full max-w-measure px-5 pt-16 pb-24 sm:px-6 sm:pt-24">
        <ArticleDetail
          article={article}
          labels={{
            categories: t('categories'),
            readingTime: (minutes) => t('readingTime', { minutes }),
            tableOfContents: t('tableOfContents'),
            tags: t('tags'),
          }}
          locale={locale}
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
        <BookmarkControl contentId={article.id} relationTo="articles" />
        <CommentSection contentId={article.id} locale={locale} relationTo="articles" />
      </div>
    </div>
  )
}
