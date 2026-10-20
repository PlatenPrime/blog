import config from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import type { User } from '@/payload-types'

export async function getCurrentUser(): Promise<User | null> {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })
  return (user as User | null) ?? null
}
