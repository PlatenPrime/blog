import { Badge } from '@/components/ui/badge'
import { formatPublishedOn } from '@/content/formatPublishedOn'
import { feedPageHref, type FeedItem } from '@/content/feedQuery'
import { latestPublicPath } from '@/content/latestPublicQuery'
import { Link } from '@/i18n/navigation'

type FeedListLabels = {
  article: string
  next: string
  note: string
  pageStatus: string
  pagination: string
  previous: string
}

type FeedListProps = {
  items: FeedItem[]
  labels: FeedListLabels
  locale: string
  page: number
  pageCount: number
}

/**
 * One page of the mixed feed. Titles stay links, not a second heading level:
 * the page already has its own h1.
 */
export function FeedList({ items, labels, locale, page, pageCount }: FeedListProps) {
  return (
    <>
      <ul className="m-0 mt-10 list-none p-0">
        {items.map((item) => {
          const publishedOn = item.publishedAt ? formatPublishedOn(item.publishedAt, locale) : null

          return (
            <li className="border-b border-border py-5" key={`${item.collection}-${item.slug}`}>
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
      {pageCount > 1 ? (
        <nav
          aria-label={labels.pagination}
          className="mt-10 flex flex-wrap items-baseline gap-x-6 gap-y-2 font-sans text-small"
        >
          {page > 1 ? (
            <Link
              className="text-primary underline-offset-4 hover:underline"
              href={feedPageHref(page - 1)}
              rel="prev"
            >
              {labels.previous}
            </Link>
          ) : null}
          <p className="m-0 text-muted-foreground">{labels.pageStatus}</p>
          {page < pageCount ? (
            <Link
              className="text-primary underline-offset-4 hover:underline"
              href={feedPageHref(page + 1)}
              rel="next"
            >
              {labels.next}
            </Link>
          ) : null}
        </nav>
      ) : null}
    </>
  )
}
