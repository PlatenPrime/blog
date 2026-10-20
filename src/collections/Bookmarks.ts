import type { Access, CollectionBeforeValidateHook, CollectionConfig } from 'payload'
import { APIError } from 'payload'

import { isAuthenticated } from '../access/isAuthenticated'
import { isOwnerOrAdmin } from '../access/isOwnerOrAdmin'
import type { AccessUser } from '../access/types'
import { buildBookmarkDuplicateWhere, normalizeBookmarkContent } from './bookmarkUniqueness'

const authenticatedCreate: Access = ({ req: { user } }) => isAuthenticated(user as AccessUser)

/**
 * Force user from session on create so clients cannot spoof another owner.
 */
const setUserFromSession: CollectionBeforeValidateHook = ({ data, operation, req }) => {
  if (operation !== 'create' || !data) return data

  const user = req.user as AccessUser
  if (user?.id != null) {
    data.user = user.id
  }

  return data
}

/**
 * Reject create/update when (user, content) already exists.
 */
const rejectDuplicateBookmark: CollectionBeforeValidateHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (!data || (operation !== 'create' && operation !== 'update')) return data

  const userId =
    operation === 'create'
      ? (req.user as AccessUser)?.id
      : (data.user ??
        (typeof originalDoc?.user === 'object' && originalDoc.user != null
          ? (originalDoc.user as { id: number | string }).id
          : originalDoc?.user))

  const content = normalizeBookmarkContent(data.content ?? originalDoc?.content)

  if (userId == null || !content) return data

  const { totalDocs } = await req.payload.find({
    collection: 'bookmarks',
    where: buildBookmarkDuplicateWhere({
      userId,
      content,
      excludeId: operation === 'update' ? originalDoc?.id : undefined,
    }),
    limit: 0,
    depth: 0,
    overrideAccess: true,
  })

  if (totalDocs > 0) {
    throw new APIError('Bookmark already exists for this user and content', 409)
  }

  return data
}

export const Bookmarks: CollectionConfig = {
  slug: 'bookmarks',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['user', 'content', 'createdAt'],
  },
  access: {
    read: isOwnerOrAdmin,
    create: authenticatedCreate,
    update: isOwnerOrAdmin,
    delete: isOwnerOrAdmin,
  },
  hooks: {
    beforeValidate: [setUserFromSession, rejectDuplicateBookmark],
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        readOnly: true,
        description: 'Set automatically from the authenticated user on create.',
      },
    },
    {
      name: 'content',
      type: 'relationship',
      relationTo: ['articles', 'notes'],
      required: true,
      admin: {
        description: 'Article or Note being bookmarked.',
      },
    },
  ],
}
