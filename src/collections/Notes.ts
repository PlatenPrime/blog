import type { Access, CollectionConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'
import { publishedOrAdmin } from '../access/publishedOrAdmin'
import type { AccessUser } from '../access/types'
import { createPreviewUrl } from '../preview/generatePreviewUrl'
import { adminGroups, collectionLabels } from './adminUi'
import { seoFields } from './seoFields'
import { ensureSlugFromTitle, taxonomyTitleAndSlugFields } from './taxonomyFields'

const adminOnly: Access = ({ req: { user } }) => isAdmin(user as AccessUser)

export const Notes: CollectionConfig = {
  slug: 'notes',
  labels: collectionLabels(
    { singular: 'Note', plural: 'Notes' },
    { singular: 'Заметка', plural: 'Заметки' },
  ),
  admin: {
    group: adminGroups.content,
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'publishedAt', 'updatedAt'],
    description: {
      en: 'Short thoughts — lighter than Articles.',
      ru: 'Короткие мысли — легче, чем статьи.',
    },
    preview: createPreviewUrl('notes'),
  },
  versions: {
    drafts: true,
  },
  access: {
    read: publishedOrAdmin,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  hooks: {
    beforeValidate: [ensureSlugFromTitle],
  },
  fields: [
    ...taxonomyTitleAndSlugFields,
    {
      name: 'body',
      type: 'richText',
      localized: true,
      required: true,
      admin: {
        description: 'Short-form note body (lighter than a full article).',
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'Public publish timestamp (schedule job — step 036).',
      },
    },
    seoFields,
  ],
}
