import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext'
import type { ReactNode } from 'react'

import { ReadingFrame, ReadingMeta } from '@/components/reading/reading-frame'
import { readingProseClassName, readingTitleClassName } from '@/components/reading/reading-prose'
import { TableOfContents } from '@/components/reading/table-of-contents'
import { PayloadRichText } from '@/components/rich-text/PayloadRichText'
import { TaxonomyLine } from '@/components/taxonomy/taxonomy-line'
import { formatPublishedOn } from '@/content/formatPublishedOn'
import type { PublicNote } from '@/content/notesQuery'
import { countWords } from '@/lib/readingTime'
import { extractTableOfContents, shouldShowTableOfContents } from '@/lib/tableOfContents'

type NoteDetailLabels = {
  categories: string
  kicker: string
  tableOfContents: string
  tags: string
}

type NoteDetailProps = {
  footer?: ReactNode
  labels: NoteDetailLabels
  locale: string
  note: PublicNote
}

/**
 * Reading room for one note. Lighter than an article: a smaller title, a kicker
 * on the meta line, tighter prose, no cover. The body is still Source Serif 4.
 */
export function NoteDetail({ footer, labels, locale, note }: NoteDetailProps) {
  const publishedOn = note.publishedAt ? formatPublishedOn(note.publishedAt, locale) : null
  const hasTaxonomy = note.categories.length > 0 || note.tags.length > 0
  const tocEntries = extractTableOfContents(note.body)
  const wordCount = countWords(convertLexicalToPlaintext({ data: note.body }))
  const showToc = shouldShowTableOfContents({
    entries: tocEntries,
    surface: 'note',
    wordCount,
  })
  const meta = [
    { id: 'kicker', node: labels.kicker },
    ...(publishedOn && note.publishedAt
      ? [{ id: 'published', node: <time dateTime={note.publishedAt}>{publishedOn}</time> }]
      : []),
  ]

  return (
    <ReadingFrame
      footer={footer}
      header={
        <>
          <h1 className={`${readingTitleClassName} text-h2`}>{note.title}</h1>
          <ReadingMeta items={meta} />
          {hasTaxonomy ? (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              <TaxonomyLine kind="categories" label={labels.categories} links={note.categories} />
              <TaxonomyLine kind="tags" label={labels.tags} links={note.tags} />
            </div>
          ) : null}
        </>
      }
      toc={showToc ? <TableOfContents entries={tocEntries} title={labels.tableOfContents} /> : null}
    >
      <PayloadRichText className={readingProseClassName('note')} data={note.body} />
    </ReadingFrame>
  )
}
