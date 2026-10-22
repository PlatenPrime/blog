import type { SerializedEditorState } from 'lexical'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import { loadPreviewDoc } from '@/app/(frontend)/dev/rich-text/loadPreviewDoc'
import { DraftPreviewBanner } from '@/components/rich-text/DraftPreviewBanner'
import { PayloadRichText } from '@/components/rich-text/PayloadRichText'

type PageProps = {
  params: Promise<{ slug: string }>
}

/**
 * Temporary CMS page body preview + draftMode (roadmap 035). Product routes — 054.
 */
export default async function DevRichTextPagePage({ params }: PageProps) {
  const { slug } = await params
  const { isEnabled: isDraftPreview } = await draftMode()
  const page = await loadPreviewDoc('pages', slug)
  if (!page) notFound()

  return (
    <main style={{ maxWidth: '42rem', margin: '2rem auto', padding: '0 1rem' }}>
      {isDraftPreview ? <DraftPreviewBanner /> : null}
      <p style={{ fontSize: '0.875rem', color: '#666' }}>
        Temporary Lexical / draft preview — not the final page route.
      </p>
      <h1>{page.title}</h1>
      {isDraftPreview && page._status === 'draft' ? (
        <p style={{ fontSize: '0.875rem', color: '#888' }}>Status: draft</p>
      ) : null}
      <PayloadRichText data={page.body as SerializedEditorState} />
    </main>
  )
}
