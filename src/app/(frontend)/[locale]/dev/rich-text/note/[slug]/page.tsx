import type { SerializedEditorState } from 'lexical'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import { loadPreviewDoc } from '@/app/(frontend)/[locale]/dev/rich-text/loadPreviewDoc'
import { DraftPreviewBanner } from '@/components/rich-text/DraftPreviewBanner'
import { PayloadRichText } from '@/components/rich-text/PayloadRichText'

type PageProps = {
  params: Promise<{ slug: string }>
}

/**
 * Temporary note body preview + draftMode (roadmap 035). Product routes — 052.
 */
export default async function DevRichTextNotePage({ params }: PageProps) {
  const { slug } = await params
  const { isEnabled: isDraftPreview } = await draftMode()
  const note = await loadPreviewDoc('notes', slug)
  if (!note) notFound()

  return (
    <main style={{ maxWidth: '42rem', margin: '2rem auto', padding: '0 1rem' }}>
      {isDraftPreview ? <DraftPreviewBanner /> : null}
      <p style={{ fontSize: '0.875rem', color: '#666' }}>
        Temporary Lexical / draft preview — not the final note page.
      </p>
      <h1>{note.title}</h1>
      {isDraftPreview && note._status === 'draft' ? (
        <p style={{ fontSize: '0.875rem', color: '#888' }}>Status: draft</p>
      ) : null}
      <PayloadRichText data={note.body as SerializedEditorState} />
    </main>
  )
}
