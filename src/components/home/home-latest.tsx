import { ContentRow } from '@/components/content/content-row'
import { formatPublishedOn } from '@/content/formatPublishedOn'
import {
  latestPublicPath,
  type LatestPublicCollection,
  type LatestPublicDoc,
} from '@/content/latestPublicQuery'

type HomeLatestProps = {
  collection: LatestPublicCollection
  heading: string
  items: LatestPublicDoc[]
  locale: string
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
      <ul className="m-0 mt-2 list-none p-0">
        {items.map((item) => {
          const publishedOn = item.publishedAt ? formatPublishedOn(item.publishedAt, locale) : null

          return (
            <ContentRow
              href={latestPublicPath(collection, item.slug)}
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
    </section>
  )
}
