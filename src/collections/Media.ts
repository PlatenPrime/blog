import type { CollectionConfig } from 'payload'
import path from 'path'
import { fileURLToPath } from 'url'

import { adminGroups, collectionLabels } from './adminUi'
import { MEDIA_MIME_TYPES } from './mediaLimits'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Media: CollectionConfig = {
  slug: 'media',
  labels: collectionLabels(
    { singular: 'Media', plural: 'Media' },
    { singular: 'Медиа', plural: 'Медиа' },
  ),
  admin: {
    group: adminGroups.content,
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'mimeType', 'filesize', 'updatedAt'],
    description: {
      en: 'Images for posts and pages (upload here or from the editor).',
      ru: 'Изображения для постов и страниц (загрузка здесь или из редактора).',
    },
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Accessible description for the image (required for a11y).',
      },
    },
  ],
  upload: {
    // Repo-root `media/` (gitignored as `/media`). Relative to this file: src/collections → ../..
    staticDir: path.resolve(dirname, '../../media'),
    mimeTypes: [...MEDIA_MIME_TYPES],
  },
}
