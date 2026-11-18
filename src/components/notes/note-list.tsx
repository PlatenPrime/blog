import { ContentRow } from '@/components/content/content-row'
import { formatPublishedOn } from '@/content/formatPublishedOn'
import { latestPublicPath, type LatestPublicDoc } from '@/content/latestPublicQuery'
import { notesPageHref } from '@/content/notesQuery'
import { Link } from '@/i18n/navigation'

type NoteListLabels = {
  next: string
  pageStatus: string
  pagination: string
  previous: string
}

type NoteListProps = {
  items: LatestPublicDoc[]
  labels: NoteListLabels
  locale: string
  page: number
  pageCount: number
}

/**
 * One page of notes. Titles stay links, not a second heading level:
 * the page already has its own h1. No type label: every row is a note.
 * The row is the same component as the article list.
 */
export function NoteList({ items, labels, locale, page, pageCount }: NoteListProps) {
  return (
    <>
      <ul className="m-0 mt-10 list-none p-0">
        {items.map((item) => {
          const publishedOn = item.publishedAt ? formatPublishedOn(item.publishedAt, locale) : null

          return (
            <ContentRow
              href={latestPublicPath('notes', item.slug)}
              key={item.slug}
              meta={
                publishedOn && item.publishedAt ? (
                  <time dateTime={item.publishedAt}>{publishedOn}</time>
                ) : null
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
              href={notesPageHref(page - 1)}
              rel="prev"
            >
              {labels.previous}
            </Link>
          ) : null}
          <p className="m-0 text-muted-foreground">{labels.pageStatus}</p>
          {page < pageCount ? (
            <Link
              className="text-primary underline-offset-4 hover:underline"
              href={notesPageHref(page + 1)}
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
