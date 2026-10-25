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
 * Temporary article body preview (034) + draftMode support (035).
 * Product routes — Track 5 (051).
 */
export default async function DevRichTextArticlePage({ params }: PageProps) {
  const { slug } = await params
  const { isEnabled: isDraftPreview } = await draftMode()
  const article = await loadPreviewDoc('articles', slug)
  if (!article) notFound()

  return (
    <main style={{ maxWidth: '42rem', margin: '2rem auto', padding: '0 1rem' }}>
      {isDraftPreview ? <DraftPreviewBanner /> : null}
      <p style={{ fontSize: '0.875rem', color: '#666' }}>
        Temporary Lexical / draft preview — not the final article page.
      </p>
      <h1>{article.title}</h1>
      {isDraftPreview && article._status === 'draft' ? (
        <p style={{ fontSize: '0.875rem', color: '#888' }}>Status: draft</p>
      ) : null}
      <PayloadRichText data={article.body as SerializedEditorState} />
    </main>
  )
}
