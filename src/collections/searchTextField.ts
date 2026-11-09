import type { Field } from 'payload'

/**
 * Localized plaintext derived from Lexical `body` for public ILIKE search.
 * Hidden in admin; maintained by `setSearchTextFromBody`.
 */
export const searchTextField: Field = {
  name: 'searchText',
  type: 'textarea',
  localized: true,
  admin: {
    hidden: true,
    readOnly: true,
  },
}
