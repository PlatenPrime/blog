import type { CollectionConfig, FieldAccess } from 'payload'

import { isAdmin } from '../access/isAdmin'
import { isSelfOrAdmin } from '../access/isSelfOrAdmin'
import type { AccessUser, UserRole } from '../access/types'

const roleFieldAccess: FieldAccess = ({ req: { user } }) => isAdmin(user as AccessUser)

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'role', 'updatedAt'],
  },
  auth: true,
  access: {
    admin: ({ req: { user } }) => isAdmin(user as AccessUser),
    // Public create stays open for first-user + future reader register (030/025).
    create: () => true,
    read: isSelfOrAdmin,
    update: isSelfOrAdmin,
    delete: isSelfOrAdmin,
  },
  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        if (operation !== 'create' || !data) return data

        const { totalDocs } = await req.payload.find({
          collection: 'users',
          limit: 0,
          overrideAccess: true,
        })

        if (totalDocs === 0) {
          data.role = 'admin' satisfies UserRole
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'reader',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Reader', value: 'reader' },
      ],
      access: {
        create: roleFieldAccess,
        update: roleFieldAccess,
      },
      admin: {
        description: 'admin — /admin panel; reader — site only (comments/bookmarks later).',
      },
    },
  ],
}
