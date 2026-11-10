import { headers } from 'next/headers'

import { clientIpFromHeaders } from './rateLimitMiddleware'

/** Request IP inside Server Actions / RSC (uses next/headers). */
export async function requestClientIp(): Promise<string> {
  return clientIpFromHeaders(await headers())
}
