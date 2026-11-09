import type { DefaultNodeTypes, SerializedBlockNode } from '@payloadcms/richtext-lexical'
import type { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from 'lexical'

import { HighlightedCode } from '@/components/rich-text/highlighted-code'
import { allocateHeadingId, headingPlainText, isTocHeading } from '@/lib/tableOfContents'
import { toYouTubeEmbedSrc } from '@/lib/youtube'

type YouTubeFields = {
  blockType: 'youtube'
  url: string
  blockName?: string | null
  id?: string
}

type CodeFields = {
  blockType: 'Code'
  code: string
  language?: string | null
  blockName?: string | null
  id?: string
}

type NodeTypes = DefaultNodeTypes | SerializedBlockNode<YouTubeFields | CodeFields>
type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

const ALLOWED_HEADING_TAGS = new Set<string>(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

function createJsxConverters(): JSXConvertersFunction<NodeTypes> {
  const seenHeadingIds = new Map<string, number>()

  return ({ defaultConverters }) => ({
    ...defaultConverters,
    heading: ({ node, nodesToJSX }) => {
      const children = nodesToJSX({ nodes: node.children })
      const NodeTag = (ALLOWED_HEADING_TAGS.has(node.tag) ? node.tag : 'h1') as HeadingTag

      if (!isTocHeading(NodeTag)) {
        return <NodeTag>{children}</NodeTag>
      }

      const text = headingPlainText(node).trim()
      if (!text) {
        return <NodeTag>{children}</NodeTag>
      }

      const id = allocateHeadingId(text, seenHeadingIds)
      return (
        <NodeTag className="scroll-mt-24" id={id}>
          {children}
        </NodeTag>
      )
    },
    blocks: {
      youtube: ({ node }) => {
        const src = toYouTubeEmbedSrc(node.fields.url)
        if (!src) return null

        return (
          <div className="payload-richtext-youtube">
            <iframe
              src={src}
              title="YouTube video"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              style={{ aspectRatio: '16 / 9', width: '100%', border: 0 }}
            />
          </div>
        )
      },
      Code: ({ node }) => {
        const code = typeof node.fields.code === 'string' ? node.fields.code : ''
        if (!code) return null
        return <HighlightedCode code={code} language={node.fields.language} />
      },
    },
  })
}

type PayloadRichTextProps = {
  data: SerializedEditorState
  className?: string
}

/**
 * Lexical → JSX with Upload (default), YouTube, Code (Shiki 064), TOC heading anchors (063).
 */
export function PayloadRichText({ data, className }: PayloadRichTextProps) {
  return <RichText data={data} converters={createJsxConverters()} className={className} />
}
