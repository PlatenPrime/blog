import config from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import { cache } from 'react'

import type { User } from '@/payload-types'

/** One auth lookup per request. The header and a reading page both call this. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })
  return (user as User | null) ?? null
})
