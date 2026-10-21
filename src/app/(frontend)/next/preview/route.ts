import config from '@payload-config'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import type { PayloadRequest } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import type { AccessUser } from '@/access/types'
import { isAllowedPreviewPath, isPreviewCollection } from '@/preview/paths'

/**
 * Enable Next.js draftMode after PREVIEW_SECRET + admin session checks (roadmap 035).
 */
export async function GET(req: NextRequest): Promise<Response> {
  const payload = await getPayload({ config })
  const { searchParams } = new URL(req.url)

  const path = searchParams.get('path')
  const collection = searchParams.get('collection')
  const slug = searchParams.get('slug')
  const previewSecret = searchParams.get('previewSecret')

  const expectedSecret = process.env.PREVIEW_SECRET
  if (!expectedSecret || previewSecret !== expectedSecret) {
    return new Response('You are not allowed to preview this page', { status: 403 })
  }

  if (!path || !collection || !slug) {
    return new Response('Insufficient search params', { status: 404 })
  }

  if (!isPreviewCollection(collection) || !isAllowedPreviewPath(path)) {
    return new Response('You are not allowed to preview this page', { status: 403 })
  }

  let user: AccessUser = null

  try {
    const authResult = await payload.auth({
      req: req as unknown as PayloadRequest,
      headers: req.headers,
    })
    user = (authResult.user as AccessUser) ?? null
  } catch (error) {
    payload.logger.error({ err: error }, 'Error verifying token for draft preview')
    return new Response('You are not allowed to preview this page', { status: 403 })
  }

  const draft = await draftMode()

  if (!isAdmin(user)) {
    draft.disable()
    return new Response('You are not allowed to preview this page', { status: 403 })
  }

  draft.enable()
  redirect(path)
}
