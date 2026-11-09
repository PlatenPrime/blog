import { serializeJsonLd, type JsonLdObject } from '@/content/jsonLd'

type JsonLdProps = {
  data: JsonLdObject | JsonLdObject[]
}

/**
 * Server-only JSON-LD script. Keep builders pure in `jsonLd.ts`;
 * this component only escapes and mounts the payload.
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
      type="application/ld+json"
    />
  )
}
