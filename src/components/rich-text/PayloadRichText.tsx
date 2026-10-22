import type { DefaultNodeTypes, SerializedBlockNode } from '@payloadcms/richtext-lexical'
import type { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from 'lexical'

import { toYouTubeEmbedSrc } from '@/lib/youtube'

type YouTubeFields = {
  blockType: 'youtube'
  url: string
  blockName?: string | null
  id?: string
}

type NodeTypes = DefaultNodeTypes | SerializedBlockNode<YouTubeFields>

const jsxConverters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
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
  },
})

type PayloadRichTextProps = {
  data: SerializedEditorState
  className?: string
}

/**
 * Lexical → JSX with Upload (default) + YouTube block converters (roadmap 034).
 */
export function PayloadRichText({ data, className }: PayloadRichTextProps) {
  return <RichText data={data} converters={jsxConverters} className={className} />
}
