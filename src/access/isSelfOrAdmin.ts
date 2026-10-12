import type { Access } from 'payload'

import { isAdmin } from './isAdmin'
import type { AccessUser } from './types'

/**
 * Admin: all docs. Authenticated non-admin: only own document (query constraint).
 * Unauthenticated: deny.
 */
export const isSelfOrAdmin: Access = ({ req: { user }, id }) => {
  const accessUser = user as AccessUser

  if (!accessUser?.id) return false
  if (isAdmin(accessUser)) return true

  if (id !== undefined && id !== null) {
    return String(accessUser.id) === String(id)
  }

  return {
    id: {
      equals: accessUser.id,
    },
  }
}
