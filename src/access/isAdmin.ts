import type { AccessUser } from './types'

export function isAdmin(user: AccessUser): boolean {
  return user?.role === 'admin'
}
