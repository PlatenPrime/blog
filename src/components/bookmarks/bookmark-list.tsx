import { Badge } from '@/components/ui/badge'
import { BookmarkButton } from '@/components/bookmarks/bookmark-button'
import { formatPublishedOn } from '@/content/formatPublishedOn'
import { latestPublicPath } from '@/content/latestPublicQuery'
import type { BookmarkListItem } from '@/content/bookmarksQuery'
import { Link } from '@/i18n/navigation'

type BookmarkListLabels = {
  article: string
  note: string
}

type BookmarkListProps = {
  items: BookmarkListItem[]
  labels: BookmarkListLabels
  locale: string
  showToggle: boolean
}

/**
 * One window of the signed-in user's public bookmarks, newest first.
 * Titles are links. The toggle is the same control as on the reading page.
 */
export function BookmarkList({ items, labels, locale, showToggle }: BookmarkListProps) {
  return (
    <ul className="m-0 mt-10 list-none p-0">
      {items.map((item) => {
        const publishedOn = item.publishedAt ? formatPublishedOn(item.publishedAt, locale) : null

        return (
          <li
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-border py-5"
            key={`${item.collection}-${item.contentId}`}
          >
            <div>
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
            </div>
            {showToggle ? (
              <BookmarkButton contentId={item.contentId} relationTo={item.collection} saved />
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
