export type UserRole = 'admin' | 'reader'

/** Minimal user shape for access helpers (before/after payload-types sync). */
export type AccessUser = {
  id: number | string
  role?: UserRole | null
  /** Present when Users.auth.verify is enabled; hidden field on the document. */
  _verified?: boolean | null
} | null
