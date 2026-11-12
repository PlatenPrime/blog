import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ArticleDetail } from '@/components/articles/article-detail'
import { RelatedContent } from '@/components/reading/related-content'
import { ShareActions } from '@/components/share/share-actions'
import { JsonLd } from '@/components/seo/json-ld'
import { findPublicArticle } from '@/content/articles'
import { buildArticleJsonLd } from '@/content/jsonLd'
import { findContentLanguageAlternates } from '@/content/localizedAlternates'
import { buildPageMetadata } from '@/content/pageMetadata'
import { findRelatedContent } from '@/content/relatedContent'
import { rssExcerpt } from '@/content/rssQuery'
import { prefixPublicPath } from '@/i18n/paths'
import { routing } from '@/i18n/routing'
import { getServerUrl } from '@/lib/serverUrl'

type ArticlePageProps = {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { locale, slug } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  const article = await findPublicArticle(locale, slug)
  if (!article) notFound()

  const languages = await findContentLanguageAlternates('articles', article.id)

  return buildPageMetadata({
    description: rssExcerpt({
      metaDescription: article.metaDescription,
      searchText: article.searchText,
    }),
    languages,
    locale,
    pathname: `/articles/${slug}`,
    title: article.metaTitle ?? article.title,
  })
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { locale, slug } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  setRequestLocale(locale)
  const article = await findPublicArticle(locale, slug)
  if (!article) notFound()

  const [t, feed, share, related] = await Promise.all([
    getTranslations('articles'),
    getTranslations('feed'),
    getTranslations('share'),
    findRelatedContent({
      categoryIds: article.categoryIds,
      excludeCollection: 'articles',
      excludeId: article.id,
      locale,
      tagIds: article.tagIds,
    }),
  ])

  const pathname = `/articles/${slug}` as `/articles/${string}`
  const shareUrl = `${getServerUrl()}${prefixPublicPath(pathname, locale)}`

  const jsonLd = buildArticleJsonLd({
    description: article.metaDescription,
    heroUrl: article.hero?.url,
    locale,
    ogImageUrl: article.ogImage?.url,
    origin: getServerUrl(),
    pathname,
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
        <ShareActions
          labels={{
            copied: share('copied'),
            copy: share('copy'),
            facebook: share('facebook'),
            heading: share('heading'),
            native: share('native'),
            telegram: share('telegram'),
            x: share('x'),
          }}
          title={article.title}
          url={shareUrl}
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
      </div>
    </div>
  )
}
