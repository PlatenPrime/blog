import type { Access, CollectionConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'
import type { AccessUser } from '../access/types'
import { adminGroups, collectionLabels } from './adminUi'
import { ensureSlugFromTitle, taxonomyTitleAndSlugFields } from './taxonomyFields'

const adminOnly: Access = ({ req: { user } }) => isAdmin(user as AccessUser)

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: collectionLabels(
    { singular: 'Category', plural: 'Categories' },
    { singular: 'Категория', plural: 'Категории' },
  ),
  admin: {
    group: adminGroups.taxonomy,
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    description: {
      en: 'Primary taxonomy for the feed.',
      ru: 'Основная таксономия ленты.',
    },
  },
  access: {
    read: () => true,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  hooks: {
    beforeValidate: [ensureSlugFromTitle],
  },
  fields: [...taxonomyTitleAndSlugFields],
}
