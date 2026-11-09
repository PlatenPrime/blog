import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext'

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
  labels: NoteDetailLabels
  locale: string
  note: PublicNote
}

const bodyClassName = [
  'mt-8 font-sans text-body text-foreground',
  '[&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:font-sans [&_h2]:text-h3',
  '[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:font-sans [&_h3]:text-body [&_h3]:font-medium',
  '[&_p]:my-3',
  '[&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline',
  '[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6',
  '[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6',
  '[&_blockquote]:my-4 [&_blockquote]:border-l [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground',
  '[&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full',
  '[&_.payload-richtext-youtube]:my-4',
  '[&_.payload-richtext-code]:my-4',
  '[&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-small',
  '[&_:not(pre)>code]:rounded-sm [&_:not(pre)>code]:bg-muted [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-small',
].join(' ')

/**
 * Reading column for one note. Lighter than an article: sans, a smaller title,
 * no cover. Category and tag names link to their shelves.
 */
export function NoteDetail({ labels, locale, note }: NoteDetailProps) {
  const publishedOn = note.publishedAt ? formatPublishedOn(note.publishedAt, locale) : null
  const hasTaxonomy = note.categories.length > 0 || note.tags.length > 0
  const tocEntries = extractTableOfContents(note.body)
  const wordCount = countWords(convertLexicalToPlaintext({ data: note.body }))
  const showToc = shouldShowTableOfContents({
    entries: tocEntries,
    surface: 'note',
    wordCount,
  })

  return (
    <article>
      <p className="m-0 font-sans text-small text-muted-foreground">{labels.kicker}</p>
      <h1 className="mt-2 mb-0 font-sans text-h2 text-foreground">{note.title}</h1>
      {publishedOn && note.publishedAt ? (
        <time
          className="mt-3 block font-sans text-small text-muted-foreground"
          dateTime={note.publishedAt}
        >
          {publishedOn}
        </time>
      ) : null}
      {hasTaxonomy ? (
        <div className="mt-4 flex flex-col gap-1">
          <TaxonomyLine kind="categories" label={labels.categories} links={note.categories} />
          <TaxonomyLine kind="tags" label={labels.tags} links={note.tags} />
        </div>
      ) : null}
      {showToc ? <TableOfContents entries={tocEntries} title={labels.tableOfContents} /> : null}
      <PayloadRichText className={bodyClassName} data={note.body} />
    </article>
  )
}
