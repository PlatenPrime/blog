import { Badge } from '@/components/ui/badge'
import { formatPublishedOn } from '@/content/formatPublishedOn'
import type { FeedItem } from '@/content/feedQuery'
import { latestPublicPath } from '@/content/latestPublicQuery'
import { Link } from '@/i18n/navigation'

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
 * Related titles after the reading column. Empty lists are omitted by the page,
 * so this never renders a blank widget.
 */
export function RelatedContent({ items, labels, locale }: RelatedContentProps) {
  return (
    <section
      aria-labelledby="related-content-heading"
      className="mt-16"
      data-testid="related-content"
    >
      <h2
        className="m-0 font-sans text-small font-medium tracking-wide text-muted-foreground"
        id="related-content-heading"
      >
        {labels.heading}
      </h2>
      <ul className="m-0 list-none p-0">
        {items.map((item) => {
          const publishedOn = item.publishedAt ? formatPublishedOn(item.publishedAt, locale) : null

          return (
            <li className="border-b border-border py-4" key={`${item.collection}-${item.slug}`}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <Badge className="font-sans" variant="outline">
                  {item.collection === 'articles' ? labels.article : labels.note}
                </Badge>
                <Link
                  className="font-serif text-h3 text-foreground underline-offset-4 hover:underline"
                  href={latestPublicPath(item.collection, item.slug)}
                >
                  {item.title}
                </Link>
              </div>
              {publishedOn && item.publishedAt ? (
                <time
                  className="mt-1 block font-sans text-small text-muted-foreground"
                  dateTime={item.publishedAt}
                >
                  {publishedOn}
                </time>
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
