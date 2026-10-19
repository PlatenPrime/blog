import type { Field } from 'payload'

/** Reusable SEO group for Articles / Notes / Pages. */
export const seoFields: Field = {
  name: 'seo',
  type: 'group',
  label: 'SEO',
  fields: [
    {
      name: 'metaTitle',
      type: 'text',
      localized: true,
      admin: {
        description: 'Overrides document title in <title> / OG when set.',
      },
    },
    {
      name: 'metaDescription',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'ogImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Open Graph image; falls back to hero when unset (later).',
      },
    },
  ],
}
