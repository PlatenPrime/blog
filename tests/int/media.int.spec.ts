import { getPayload, type Payload } from 'payload'
import type { User } from '@/payload-types'
import config from '@/payload.config'

import { beforeAll, describe, expect, it } from 'vitest'

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

  it('denies reader create (admin-only upload)', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const reader = (await payload.create({
      collection: 'users',
      data: {
        email: `media-reader-${suffix}@example.com`,
        password: 'test-password-123',
        role: 'reader',
        _verified: true,
      },
      overrideAccess: true,
    })) as User

    await expect(
      payload.create({
        collection: 'media',
        user: reader,
        overrideAccess: false,
        data: { alt: 'reader should not upload' },
        file: pngFile,
      }),
    ).rejects.toThrow()
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
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const admin = (await payload.create({
      collection: 'users',
      data: {
        email: `media-admin-${suffix}@example.com`,
        password: 'test-password-123',
        role: 'admin',
        _verified: true,
      },
      overrideAccess: true,
    })) as User

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
