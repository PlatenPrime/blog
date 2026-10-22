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

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: collectionLabels(
    { singular: 'Page', plural: 'Pages' },
    { singular: 'Страница', plural: 'Страницы' },
  ),
  admin: {
    group: adminGroups.content,
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'publishedAt', 'updatedAt'],
    description: {
      en: 'Static CMS pages (About, Privacy, Terms).',
      ru: 'Статические страницы (About, Privacy, Terms).',
    },
    preview: createPreviewUrl('pages'),
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
      admin: {
        description: 'Static page body (About, Privacy, Terms, etc.).',
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
