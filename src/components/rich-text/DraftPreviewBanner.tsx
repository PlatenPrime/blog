/**
 * Visible only while Next.js draftMode is enabled (roadmap 035).
 */
export function DraftPreviewBanner() {
  return (
    <p
      style={{
        fontSize: '0.875rem',
        padding: '0.75rem 1rem',
        background: '#1a1a1a',
        color: '#f5f5f5',
        marginBottom: '1.5rem',
      }}
    >
      Draft preview — drafts are visible because draft mode is on.{' '}
      <a href="/next/exit-preview" style={{ color: '#9ecbff' }}>
        Exit preview
      </a>
    </p>
  )
}
