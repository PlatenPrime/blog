import type { Access } from 'payload'

import { isAdmin } from './isAdmin'
import type { AccessUser } from './types'

/**
 * Admin: all docs (including drafts). Everyone else: only published (`_status`).
 * Requires `versions.drafts` on the collection.
 */
export const publishedOrAdmin: Access = ({ req: { user } }) => {
  if (isAdmin(user as AccessUser)) return true

  return {
    _status: {
      equals: 'published',
    },
  }
}
