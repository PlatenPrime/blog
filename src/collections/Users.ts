import type { CollectionConfig, FieldAccess } from 'payload'

import { isAdmin } from '../access/isAdmin'
import type { AccessUser, UserRole } from '../access/types'
import { adminGroups, collectionLabels } from './adminUi'

const roleFieldAccess: FieldAccess = ({ req: { user } }) => isAdmin(user as AccessUser)

const isProduction = process.env.NODE_ENV === 'production'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: collectionLabels(
    { singular: 'User', plural: 'Users' },
    { singular: 'Пользователь', plural: 'Пользователи' },
  ),
  admin: {
    group: adminGroups.system,
    useAsTitle: 'email',
    defaultColumns: ['email', 'role', 'createdAt', 'updatedAt'],
    description: {
      en: 'Site author accounts for /admin only. No public registration.',
      ru: 'Аккаунты автора для /admin. Публичной регистрации нет.',
    },
  },
  auth: {
    // Cookie hygiene: HttpOnly is Payload default; Secure in prod; SameSite=Lax for same-site app.
    cookies: {
      sameSite: 'Lax',
      secure: isProduction,
    },
    tokenExpiration: 60 * 60 * 24 * 7, // 7 days
    maxLoginAttempts: 8,
    lockTime: 10 * 60 * 1000,
  },
  access: {
    admin: ({ req: { user } }) => isAdmin(user as AccessUser),
    // First admin: `npm run seed:admin` (overrideAccess). Afterwards only admins create users.
    create: ({ req: { user } }) => isAdmin(user as AccessUser),
    read: ({ req: { user } }) => isAdmin(user as AccessUser),
    update: ({ req: { user } }) => isAdmin(user as AccessUser),
    delete: ({ req: { user } }) => isAdmin(user as AccessUser),
  },
  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        if (!data) return data
        if (operation === 'create') {
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
      defaultValue: 'admin',
      options: [{ label: 'Admin', value: 'admin' }],
      access: {
        create: roleFieldAccess,
        update: roleFieldAccess,
      },
      admin: {
        description: 'admin — /admin panel only. Public site has no reader accounts.',
      },
    },
  ],
}
