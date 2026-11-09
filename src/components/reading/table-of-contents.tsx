import type { TocEntry } from '@/lib/tableOfContents'

type TableOfContentsProps = {
  entries: readonly TocEntry[]
  title: string
}

/**
 * In-flow section nav for long reading columns. Links use heading fragment ids.
 */
export function TableOfContents({ entries, title }: TableOfContentsProps) {
  const headingId = 'table-of-contents-heading'

  return (
    <nav aria-labelledby={headingId} className="mt-8 border-t border-border pt-6">
      <h2 className="m-0 font-sans text-small font-medium text-foreground" id={headingId}>
        {title}
      </h2>
      <ol className="mt-3 m-0 list-none p-0">
        {entries.map((entry) => (
          <li className={entry.depth === 3 ? 'mt-1.5 pl-4' : 'mt-1.5 first:mt-0'} key={entry.id}>
            <a
              className="font-sans text-small text-primary underline-offset-4 hover:underline"
              href={`#${entry.id}`}
            >
              {entry.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
