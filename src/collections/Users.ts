import type { CollectionConfig, FieldAccess } from 'payload'

import { isAdmin } from '../access/isAdmin'
import { isSelfOrAdmin } from '../access/isSelfOrAdmin'
import type { AccessUser, UserRole } from '../access/types'
import {
  resetPasswordEmailHTML,
  resetPasswordEmailSubject,
  verificationEmailHTML,
  verificationEmailSubject,
} from '../auth/emailTemplates'
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
      en: 'Admins (CMS) and readers (site auth).',
      ru: 'Админы (CMS) и читатели (авторизация на сайте).',
    },
  },
  auth: {
    // Cookie hygiene (step 030): HttpOnly is Payload default; Secure in prod; SameSite=Lax for same-site app.
    cookies: {
      sameSite: 'Lax',
      secure: isProduction,
    },
    tokenExpiration: 60 * 60 * 24 * 7, // 7 days
    maxLoginAttempts: 8,
    lockTime: 10 * 60 * 1000,
    verify: {
      generateEmailHTML: ({ token }) => verificationEmailHTML(token),
      generateEmailSubject: () => verificationEmailSubject(),
    },
    forgotPassword: {
      expiration: 60 * 60 * 1000, // 1 hour
      minRequestInterval: 15_000,
      generateEmailHTML: (args) => resetPasswordEmailHTML(args?.token ?? ''),
      generateEmailSubject: () => resetPasswordEmailSubject(),
    },
  },
  access: {
    admin: ({ req: { user } }) => isAdmin(user as AccessUser),
    // Public self-register for readers; first-user bootstrap still works.
    create: () => true,
    read: isSelfOrAdmin,
    update: isSelfOrAdmin,
    delete: isSelfOrAdmin,
  },
  hooks: {
    beforeValidate: [
      async ({ data, operation, req, originalDoc }) => {
        if (!data) return data

        if (operation === 'create') {
          const { totalDocs } = await req.payload.find({
            collection: 'users',
            limit: 0,
            overrideAccess: true,
          })

          if (totalDocs === 0) {
            data.role = 'admin' satisfies UserRole
          } else {
            const actor = req.user as AccessUser
            // Non-admins (and anonymous register) cannot create admin accounts.
            if (!isAdmin(actor)) {
              data.role = 'reader' satisfies UserRole
            }
          }
        }

        // Payload JWT ignores sessions when verify is on and `_verified` is not true.
        // Login allows null, so unverified admins get a login↔/admin redirect loop.
        const nextRole = (data.role ?? originalDoc?.role) as UserRole | undefined
        if (nextRole === 'admin') {
          data._verified = true
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
        description: 'admin — /admin panel; reader — site only (comments/bookmarks).',
      },
    },
    {
      name: 'sub',
      type: 'text',
      index: true,
      access: {
        read: () => true,
        create: () => true,
        update: () => false,
      },
      admin: {
        description:
          'OAuth subject (Google). Set by the OAuth plugin; unused for password-only users.',
        readOnly: true,
      },
    },
  ],
}
