import { highlightCode } from '@/lib/codeHighlight'

type HighlightedCodeProps = {
  code: string
  language?: string | null
}

/**
 * Async RSC: Shiki highlight for Lexical Code blocks (roadmap 064).
 * Dual-theme CSS variables; `html.dark` swaps colors without re-highlight.
 */
export async function HighlightedCode({ code, language }: HighlightedCodeProps) {
  const { html, language: resolved } = await highlightCode(code, language)

  return (
    <div className="payload-richtext-code" data-language={resolved}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
