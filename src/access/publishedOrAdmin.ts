import type { Access } from 'payload'

import { isAdmin } from './isAdmin'
import { publicContentWhere } from './publicContentWhere'
import type { AccessUser } from './types'

/**
 * Admin: all docs (including drafts and future `publishedAt`).
 * Everyone else: published and visible now (ADR-003 query-time schedule).
 * Requires `versions.drafts` on the collection.
 */
export const publishedOrAdmin: Access = ({ req: { user } }) => {
  if (isAdmin(user as AccessUser)) return true

  return publicContentWhere()
}
