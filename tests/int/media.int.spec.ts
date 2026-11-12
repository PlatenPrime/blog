/** @vitest-environment node */
import { getPayload, type Payload } from 'payload'

import config from '@/payload.config'

import { beforeAll, describe, expect, it } from 'vitest'

import { createTestUser, uniqueSuffix } from '../helpers/factories'

/** 1×1 PNG — valid image/png for Media upload + WebP conversion. */
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

const pngFile = {
  data: TINY_PNG,
  mimetype: 'image/png',
  name: 'pixel.png',
  size: TINY_PNG.length,
}

let payload: Payload

describe('Media access (Local API)', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('denies anonymous create', async () => {
    await expect(
      payload.create({
        collection: 'media',
        overrideAccess: false,
        data: { alt: 'anonymous should not upload' },
        file: pngFile,
      }),
    ).rejects.toThrow()
  })

  it('allows admin create and stores WebP', async () => {
    const suffix = uniqueSuffix()
    const admin = await createTestUser(payload, {
      email: `media-admin-${suffix}@example.com`,
    })

    const doc = await payload.create({
      collection: 'media',
      user: admin,
      overrideAccess: false,
      data: { alt: `admin upload ${suffix}` },
      file: {
        ...pngFile,
        name: `pixel-${suffix}.png`,
      },
    })

    expect(doc.alt).toBe(`admin upload ${suffix}`)
    expect(doc.mimeType).toBe('image/webp')
    expect(doc.filename?.endsWith('.webp')).toBe(true)
  })
})
