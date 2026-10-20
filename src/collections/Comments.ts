import type { Access, CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { approvedOrAdmin } from '../access/approvedOrAdmin'
import { isAdmin } from '../access/isAdmin'
import { isAuthenticatedAndVerified } from '../access/isVerified'
import type { AccessUser } from '../access/types'

const adminOnly: Access = ({ req: { user } }) => isAdmin(user as AccessUser)

/** Comments require an authenticated + email-verified user (ADR-002). */
const verifiedCreate: Access = ({ req: { user } }) => isAuthenticatedAndVerified(user as AccessUser)

/**
 * Force author from session on create so clients cannot spoof another user.
 */
const setAuthorFromUser: CollectionBeforeValidateHook = ({ data, operation, req }) => {
  if (operation !== 'create' || !data) return data

  const user = req.user as AccessUser
  if (user?.id != null) {
    data.author = user.id
  }

  return data
}

export const Comments: CollectionConfig = {
  slug: 'comments',
  admin: {
    useAsTitle: 'body',
    defaultColumns: ['body', 'author', 'moderationStatus', 'createdAt'],
  },
  access: {
    read: approvedOrAdmin,
    create: verifiedCreate,
    update: adminOnly,
    delete: adminOnly,
  },
  hooks: {
    beforeValidate: [setAuthorFromUser],
  },
  fields: [
    {
      name: 'content',
      type: 'relationship',
      relationTo: ['articles', 'notes'],
      required: true,
      admin: {
        description: 'Article or Note this comment belongs to.',
      },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        readOnly: true,
        description: 'Set automatically from the authenticated user on create.',
      },
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
    },
    {
      name: 'moderationStatus',
      type: 'select',
      required: true,
      defaultValue: 'approved',
      options: [
        { label: 'Approved', value: 'approved' },
        { label: 'Hidden', value: 'hidden' },
      ],
      access: {
        create: ({ req: { user } }) => isAdmin(user as AccessUser),
        update: ({ req: { user } }) => isAdmin(user as AccessUser),
      },
      admin: {
        position: 'sidebar',
        description: 'Soft moderation (public UI respects this from step 058).',
      },
    },
  ],
}
