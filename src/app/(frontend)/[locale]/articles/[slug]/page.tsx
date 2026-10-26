import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ArticleDetail } from '@/components/articles/article-detail'
import { CommentSection } from '@/components/comments/comment-section'
import { findPublicArticle } from '@/content/articles'
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

  const t = await getTranslations('articles')

  return (
    <div className="bg-background font-serif text-foreground">
      <div className="mx-auto w-full max-w-measure px-5 pt-16 pb-24 sm:px-6 sm:pt-24">
        <ArticleDetail
          article={article}
          labels={{ categories: t('categories'), tags: t('tags') }}
          locale={locale}
        />
        <CommentSection contentId={article.id} locale={locale} relationTo="articles" />
      </div>
    </div>
  )
}
