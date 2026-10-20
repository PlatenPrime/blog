import type { AccessUser } from './types'

/**
 * Email-verified readers (and admins) may perform sensitive site actions.
 * Admins are always treated as verified (bootstrap / CMS path).
 */
export function isVerified(user: AccessUser): boolean {
  if (!user?.id) return false
  if (user.role === 'admin') return true
  return user._verified === true
}

export function isAuthenticatedAndVerified(user: AccessUser): boolean {
  return Boolean(user?.id) && isVerified(user)
}
