import type { Access } from 'payload'

import { isAdmin } from './isAdmin'
import type { AccessUser } from './types'

/**
 * Admin: all comments. Everyone else: only `moderationStatus: approved`.
 */
export const approvedOrAdmin: Access = ({ req: { user } }) => {
  if (isAdmin(user as AccessUser)) return true

  return {
    moderationStatus: {
      equals: 'approved',
    },
  }
}
