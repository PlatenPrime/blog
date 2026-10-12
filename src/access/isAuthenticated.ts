import type { AccessUser } from './types'

export function isAuthenticated(user: AccessUser): boolean {
  return Boolean(user?.id)
}
