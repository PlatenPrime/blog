import { ContentRow } from '@/components/content/content-row'
import { formatPublishedOn } from '@/content/formatPublishedOn'
import { feedPageHref, type FeedItem } from '@/content/feedQuery'
import { latestPublicPath } from '@/content/latestPublicQuery'
import { Link } from '@/i18n/navigation'

type FeedListPageHref = string | { pathname: string; query?: Record<string, string> }

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
  pageHref?: (page: number) => FeedListPageHref
}

/**
 * One page of the mixed feed. Titles stay links, not a second heading level:
 * the page already has its own h1. Type sits in the meta line, not a badge.
 */
export function FeedList({
  items,
  labels,
  locale,
  page,
  pageCount,
  pageHref = feedPageHref,
}: FeedListProps) {
  return (
    <>
      <ul className="m-0 mt-10 list-none p-0">
        {items.map((item) => {
          const publishedOn = item.publishedAt ? formatPublishedOn(item.publishedAt, locale) : null
          const kind = item.collection === 'articles' ? labels.article : labels.note

          return (
            <ContentRow
              href={latestPublicPath(item.collection, item.slug)}
              key={`${item.collection}-${item.slug}`}
              meta={
                <>
                  {kind}
                  {publishedOn && item.publishedAt ? (
                    <>
                      {' · '}
                      <time dateTime={item.publishedAt}>{publishedOn}</time>
                    </>
                  ) : null}
                </>
              }
              title={item.title}
            />
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
              href={pageHref(page - 1)}
              rel="prev"
            >
              {labels.previous}
            </Link>
          ) : null}
          <p className="m-0 text-muted-foreground">{labels.pageStatus}</p>
          {page < pageCount ? (
            <Link
              className="text-primary underline-offset-4 hover:underline"
              href={pageHref(page + 1)}
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
