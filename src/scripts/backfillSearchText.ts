/**
 * CLI: fill localized `searchText` from Lexical `body` (roadmap 066).
 *
 *   npm run backfill:search-text
 *
 * Idempotent: re-running overwrites with the current plaintext extraction.
 */
import 'dotenv/config'

import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext'
import type { SerializedEditorState } from 'lexical'
import { getPayload } from 'payload'

import config from '../payload.config'
import { routing } from '../i18n/routing'

const collections = ['articles', 'notes'] as const
const pageSize = 50

async function main(): Promise<void> {
  const payload = await getPayload({ config })
  let updated = 0

  for (const collection of collections) {
    for (const locale of routing.locales) {
      let page = 1

      for (;;) {
        const result = await payload.find({
          collection,
          depth: 0,
          draft: true,
          limit: pageSize,
          locale,
          overrideAccess: true,
          page,
          pagination: true,
        })

        for (const doc of result.docs) {
          const body = doc.body
          if (!isLexicalBody(body)) continue

          await payload.update({
            collection,
            id: doc.id,
            locale,
            data: {
              searchText: convertLexicalToPlaintext({ data: body }),
            },
            draft: true,
            overrideAccess: true,
          })
          updated += 1
        }

        if (page >= result.totalPages) break
        page += 1
      }
    }
  }

  payload.logger.info(`backfill:search-text — updated ${updated} locale rows`)
}

function isLexicalBody(value: unknown): value is SerializedEditorState {
  return typeof value === 'object' && value !== null && 'root' in value
}

main().catch((error: unknown) => {
  console.error('backfill:search-text failed:', error)
  process.exitCode = 1
})
