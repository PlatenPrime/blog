import type { CollectionBeforeValidateHook, Field } from 'payload'

import { slugify } from '../lib/slugify'

/** Shared title + slug for Categories / Tags (localized). */
export const taxonomyTitleAndSlugFields: Field[] = [
  {
    name: 'title',
    type: 'text',
    required: true,
    localized: true,
  },
  {
    name: 'slug',
    type: 'text',
    required: true,
    unique: true,
    localized: true,
    index: true,
    admin: {
      position: 'sidebar',
      description: 'URL segment; auto-filled from title when left empty.',
    },
  },
]

/** Fill empty slug from title (per-locale payload data). */
export const ensureSlugFromTitle: CollectionBeforeValidateHook = ({ data }) => {
  if (!data) return data

  const title = typeof data.title === 'string' ? data.title : ''
  const slug = typeof data.slug === 'string' ? data.slug.trim() : ''

  if (!slug && title) {
    data.slug = slugify(title)
  }

  return data
}
