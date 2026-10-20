import type { Access } from 'payload'

import { isAdmin } from './isAdmin'
import type { AccessUser } from './types'

/**
 * Admin: all docs. Authenticated non-admin: only docs where `user` equals session user.
 * Unauthenticated: deny.
 *
 * Unlike `isSelfOrAdmin` (filters by document `id`), this constrains by the `user` relationship field.
 */
export const isOwnerOrAdmin: Access = ({ req: { user } }) => {
  const accessUser = user as AccessUser

  if (!accessUser?.id) return false
  if (isAdmin(accessUser)) return true

  return {
    user: {
      equals: accessUser.id,
    },
  }
}
