import {
  BlocksFeature,
  CodeBlock,
  UploadFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { YouTubeBlock } from '@/blocks/YouTube'
import { CODE_BLOCK_LANGUAGES } from '@/lib/codeLanguages'

/**
 * Shared Lexical editor: default features + Media uploads + YouTube + Code (034, 064).
 */
export const editor = lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures.filter((feature) => feature.key !== 'upload'),
    UploadFeature({
      enabledCollections: ['media'],
    }),
    BlocksFeature({
      blocks: [
        YouTubeBlock,
        CodeBlock({
          defaultLanguage: 'ts',
          languages: { ...CODE_BLOCK_LANGUAGES },
        }),
      ],
    }),
  ],
})
