import type { Access, CollectionConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'
import type { AccessUser } from '../access/types'
import { adminGroups, collectionLabels } from './adminUi'
import { ensureSlugFromTitle, taxonomyTitleAndSlugFields } from './taxonomyFields'

const adminOnly: Access = ({ req: { user } }) => isAdmin(user as AccessUser)

export const Tags: CollectionConfig = {
  slug: 'tags',
  labels: collectionLabels(
    { singular: 'Tag', plural: 'Tags' },
    { singular: 'Тег', plural: 'Теги' },
  ),
  admin: {
    group: adminGroups.taxonomy,
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    description: {
      en: 'Secondary labels for cross-cutting topics.',
      ru: 'Вторичные метки для сквозных тем.',
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
