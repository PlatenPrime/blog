import type { Access, CollectionConfig } from 'payload'
import path from 'path'
import { fileURLToPath } from 'url'

import { isAdmin } from '../access/isAdmin'
import type { AccessUser } from '../access/types'
import { adminGroups, collectionLabels } from './adminUi'
import { MEDIA_MIME_TYPES, mediaWebpFormatOptions } from './mediaLimits'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const adminOnly: Access = ({ req: { user } }) => isAdmin(user as AccessUser)

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
    // Public read for site/CDN URLs; upload/mutate only admin (roadmap 039).
    read: () => true,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
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
    // Local disk when R2_* unset. With R2, `@payloadcms/storage-s3` sets disableLocalStorage (step 037).
    staticDir: path.resolve(dirname, '../../media'),
    mimeTypes: [...MEDIA_MIME_TYPES],
    // Convert originals to WebP on upload (sharp; roadmap 038).
    formatOptions: mediaWebpFormatOptions,
  },
}
