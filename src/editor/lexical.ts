import {
  BlocksFeature,
  UploadFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { YouTubeBlock } from '@/blocks/YouTube'

/**
 * Shared Lexical editor: default features + Media uploads + YouTube block (roadmap 034).
 */
export const editor = lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures.filter((feature) => feature.key !== 'upload'),
    UploadFeature({
      enabledCollections: ['media'],
    }),
    BlocksFeature({
      blocks: [YouTubeBlock],
    }),
  ],
})
