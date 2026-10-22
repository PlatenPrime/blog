import type { Block } from 'payload'

import { validateYouTubeUrl } from '@/lib/youtube'

/**
 * Lexical block: YouTube embed by URL (roadmap 034).
 * No video upload — tech-stack: video only via YouTube embed.
 */
export const YouTubeBlock: Block = {
  slug: 'youtube',
  interfaceName: 'YouTubeBlock',
  labels: {
    singular: { en: 'YouTube', ru: 'YouTube' },
    plural: { en: 'YouTube', ru: 'YouTube' },
  },
  fields: [
    {
      name: 'url',
      type: 'text',
      required: true,
      label: { en: 'YouTube URL', ru: 'Ссылка YouTube' },
      admin: {
        description: {
          en: 'Paste a youtube.com or youtu.be link. Stored as embed via youtube-nocookie.',
          ru: 'Вставьте ссылку youtube.com или youtu.be. На сайте — embed через youtube-nocookie.',
        },
      },
      validate: (value: unknown) => validateYouTubeUrl(value),
    },
  ],
}
