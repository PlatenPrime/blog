import { ContentRow } from '@/components/content/content-row'
import { formatPublishedOn } from '@/content/formatPublishedOn'
import type { FeedItem } from '@/content/feedQuery'
import { latestPublicPath } from '@/content/latestPublicQuery'

type RelatedContentLabels = {
  article: string
  heading: string
  note: string
}

type RelatedContentProps = {
  items: FeedItem[]
  labels: RelatedContentLabels
  locale: string
}

/**
 * Related titles after the reading column, in the same row as the indexes.
 * Empty lists are omitted by the page, so this never renders a blank widget.
 */
export function RelatedContent({ items, labels, locale }: RelatedContentProps) {
  return (
    <section
      aria-labelledby="related-content-heading"
      className="mt-16"
      data-testid="related-content"
    >
      <h2
        className="m-0 font-sans text-small font-medium text-muted-foreground"
        id="related-content-heading"
      >
        {labels.heading}
      </h2>
      <ul className="m-0 mt-2 list-none p-0">
        {items.map((item) => {
          const publishedOn = item.publishedAt ? formatPublishedOn(item.publishedAt, locale) : null
          const typeLabel = item.collection === 'articles' ? labels.article : labels.note

          return (
            <ContentRow
              href={latestPublicPath(item.collection, item.slug)}
              key={`${item.collection}-${item.slug}`}
              meta={
                publishedOn && item.publishedAt ? (
                  <>
                    {typeLabel}
                    <span aria-hidden="true"> · </span>
                    <time dateTime={item.publishedAt}>{publishedOn}</time>
                  </>
                ) : (
                  typeLabel
                )
              }
              title={item.title}
            />
          )
        })}
      </ul>
    </section>
  )
}
