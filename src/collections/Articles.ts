import type { Access, CollectionConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'
import { publishedOrAdmin } from '../access/publishedOrAdmin'
import type { AccessUser } from '../access/types'
import { setPublishedAtOnPublish } from '../hooks/setPublishedAtOnPublish'
import { createPreviewUrl } from '../preview/generatePreviewUrl'
import { adminGroups, collectionLabels } from './adminUi'
import { seoFields } from './seoFields'
import { ensureSlugFromTitle, taxonomyTitleAndSlugFields } from './taxonomyFields'

const adminOnly: Access = ({ req: { user } }) => isAdmin(user as AccessUser)

export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: collectionLabels(
    { singular: 'Article', plural: 'Articles' },
    { singular: 'Статья', plural: 'Статьи' },
  ),
  admin: {
    group: adminGroups.content,
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'publishedAt', 'updatedAt'],
    description: {
      en: 'Long-form posts for the public site.',
      ru: 'Развёрнутые статьи для публичного сайта.',
    },
    preview: createPreviewUrl('articles'),
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
    beforeChange: [setPublishedAtOnPublish],
  },
  fields: [
    ...taxonomyTitleAndSlugFields,
    {
      name: 'body',
      type: 'richText',
      localized: true,
      required: true,
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Cover image for the article.',
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
        description:
          'Empty = visible immediately on Publish. Future date = scheduled (hidden until then).',
      },
    },
    seoFields,
  ],
}
