import type { ReactNode } from 'react'

import { ContentImage } from '@/components/media/content-image'
import { ReadingFrame, ReadingMeta } from '@/components/reading/reading-frame'
import { readingProseClassName, readingTitleClassName } from '@/components/reading/reading-prose'
import { TableOfContents } from '@/components/reading/table-of-contents'
import { PayloadRichText } from '@/components/rich-text/PayloadRichText'
import { TaxonomyLine } from '@/components/taxonomy/taxonomy-line'
import type { ArticleHeroImage, PublicArticle } from '@/content/articlesQuery'
import { formatPublishedOn } from '@/content/formatPublishedOn'
import { readingTimeFromLexical } from '@/lib/readingTime'
import { extractTableOfContents, shouldShowTableOfContents } from '@/lib/tableOfContents'

type ArticleDetailLabels = {
  categories: string
  readingTime: (minutes: number) => string
  tableOfContents: string
  tags: string
}

type ArticleDetailProps = {
  article: PublicArticle
  footer?: ReactNode
  labels: ArticleDetailLabels
  locale: string
}

/**
 * Reading room for one article. Category and tag names link to their shelves.
 * Share and related, when present, stay in the same 65ch column.
 */
export function ArticleDetail({ article, footer, labels, locale }: ArticleDetailProps) {
  const publishedOn = article.publishedAt ? formatPublishedOn(article.publishedAt, locale) : null
  const readingMinutes = readingTimeFromLexical(article.body)
  const readingTimeLabel = readingMinutes > 0 ? labels.readingTime(readingMinutes) : null
  const hasTaxonomy = article.categories.length > 0 || article.tags.length > 0
  const tocEntries = extractTableOfContents(article.body)
  const showToc = shouldShowTableOfContents({
    entries: tocEntries,
    surface: 'article',
    wordCount: 0,
  })
  const meta = [
    ...(publishedOn && article.publishedAt
      ? [{ id: 'published', node: <time dateTime={article.publishedAt}>{publishedOn}</time> }]
      : []),
    ...(readingTimeLabel ? [{ id: 'reading', node: readingTimeLabel }] : []),
  ]

  return (
    <ReadingFrame
      footer={footer}
      header={
        <>
          {article.hero ? <ArticleHero hero={article.hero} /> : null}
          <h1 className={`${readingTitleClassName} text-h1`}>{article.title}</h1>
          <ReadingMeta items={meta} />
          {hasTaxonomy ? (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              <TaxonomyLine
                kind="categories"
                label={labels.categories}
                links={article.categories}
              />
              <TaxonomyLine kind="tags" label={labels.tags} links={article.tags} />
            </div>
          ) : null}
        </>
      }
      toc={showToc ? <TableOfContents entries={tocEntries} title={labels.tableOfContents} /> : null}
    >
      <PayloadRichText className={readingProseClassName('reading')} data={article.body} />
    </ReadingFrame>
  )
}

function ArticleHero({ hero }: { hero: ArticleHeroImage }) {
  return (
    <ContentImage
      alt={hero.alt}
      className="mb-10 h-auto w-full"
      height={hero.height}
      priority
      src={hero.url}
      width={hero.width}
    />
  )
}
