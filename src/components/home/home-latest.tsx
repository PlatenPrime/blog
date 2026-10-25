import {
  latestPublicPath,
  type LatestPublicCollection,
  type LatestPublicDoc,
} from '@/content/latestPublicQuery'
import { Link } from '@/i18n/navigation'

type HomeLatestProps = {
  collection: LatestPublicCollection
  heading: string
  items: LatestPublicDoc[]
  locale: string
}

function formatPublishedOn(iso: string, locale: string): string | null {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

/**
 * A short editorial list. Empty collections are omitted by the page,
 * so this never renders a blank widget.
 */
export function HomeLatest({ collection, heading, items, locale }: HomeLatestProps) {
  const headingId = `home-${collection}`

  return (
    <section aria-labelledby={headingId} className="mt-16" data-testid={headingId}>
      <h2
        className="m-0 font-sans text-small font-medium tracking-wide text-muted-foreground"
        id={headingId}
      >
        {heading}
      </h2>
      <ul className="m-0 list-none p-0">
        {items.map((item) => {
          const publishedOn = item.publishedAt ? formatPublishedOn(item.publishedAt, locale) : null

          return (
            <li className="border-b border-border py-4" key={item.slug}>
              <Link
                className="font-serif text-h3 text-foreground underline-offset-4 hover:underline"
                href={latestPublicPath(collection, item.slug)}
              >
                {item.title}
              </Link>
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
