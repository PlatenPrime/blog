/** @vitest-environment node */
import { getPayload, type Payload } from 'payload'
import type { User } from '@/payload-types'
import config from '@/payload.config'
import { isAdmin } from '@/access/isAdmin'
import {
  DEFAULT_TEST_PASSWORD,
  createArticle,
  createVerifiedReader,
  uniqueSuffix,
} from '../factories'

import { beforeAll, describe, expect, it } from 'vitest'

let payload: Payload

describe('Auth Local API (register / login / verify / reset)', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('public register creates a reader who cannot access admin', async () => {
    const email = `public-reg-${uniqueSuffix()}@example.com`

    const created = (await payload.create({
      collection: 'users',
      data: {
        email,
        password: 'register-password-123',
        role: 'reader',
      },
      overrideAccess: true,
    })) as User

    // Even if a client tried to request admin, the hook + field access keep readers as readers
    // for non-first-user creates performed without an admin actor.
    expect(created.role).toBe('reader')
    expect(created._verified).not.toBe(true)
    expect(isAdmin(created)).toBe(false)
  })

  it('login succeeds for verified reader and fails for wrong password', async () => {
    const reader = await createVerifiedReader(payload, { prefix: 'auth-reader' })

    const ok = await payload.login({
      collection: 'users',
      data: {
        email: reader.email,
        password: DEFAULT_TEST_PASSWORD,
      },
    })
    expect(ok.user?.email).toBe(reader.email)

    await expect(
      payload.login({
        collection: 'users',
        data: {
          email: reader.email,
          password: 'wrong-password-xyz',
        },
      }),
    ).rejects.toThrow()
  })

  it('verify email then allows login', async () => {
    const email = `verify-${uniqueSuffix()}@example.com`

    const created = await payload.create({
      collection: 'users',
      data: {
        email,
        password: 'verify-password-123',
        role: 'reader',
      },
      overrideAccess: true,
    })

    await expect(
      payload.login({
        collection: 'users',
        data: { email, password: 'verify-password-123' },
      }),
    ).rejects.toThrow()

    const withToken = await payload.findByID({
      collection: 'users',
      id: created.id,
      showHiddenFields: true,
      overrideAccess: true,
    })

    const token = withToken._verificationToken
    expect(token).toBeTruthy()

    await payload.verifyEmail({
      collection: 'users',
      token: token as string,
    })

    const loggedIn = await payload.login({
      collection: 'users',
      data: { email, password: 'verify-password-123' },
    })
    expect(loggedIn.user?.email).toBe(email)
  })

  it('password reset changes credentials', async () => {
    const reader = await createVerifiedReader(payload, { prefix: 'auth-reader' })

    const token = await payload.forgotPassword({
      collection: 'users',
      data: { email: reader.email },
      disableEmail: true,
    })
    expect(token).toBeTruthy()

    await payload.resetPassword({
      collection: 'users',
      data: {
        token: token as string,
        password: 'new-password-456',
      },
      overrideAccess: true,
    })

    await expect(
      payload.login({
        collection: 'users',
        data: { email: reader.email, password: DEFAULT_TEST_PASSWORD },
      }),
    ).rejects.toThrow()

    const loggedIn = await payload.login({
      collection: 'users',
      data: { email: reader.email, password: 'new-password-456' },
    })
    expect(loggedIn.user?.email).toBe(reader.email)
  })

  it('unverified reader cannot create comments', async () => {
    const unverified = await createVerifiedReader(payload, {
      prefix: 'unverified',
      verified: false,
    })

    const article = await createArticle(payload, {
      prefix: 'auth-comment',
      body: 'body',
    })

    await expect(
      payload.create({
        collection: 'comments',
        user: unverified,
        overrideAccess: false,
        data: {
          content: {
            relationTo: 'articles',
            value: article.id,
          },
          body: 'Should be denied',
          moderationStatus: 'approved',
          author: unverified.id,
        },
      }),
    ).rejects.toThrow()
  })

  it('reader cannot create articles', async () => {
    const reader = await createVerifiedReader(payload, { prefix: 'auth-reader' })

    await expect(
      payload.create({
        collection: 'articles',
        user: reader,
        overrideAccess: false,
        data: {
          title: `Reader write ${uniqueSuffix()}`,
          slug: `reader-write-${uniqueSuffix()}`,
          body: {
            root: {
              type: 'root',
              format: '',
              indent: 0,
              version: 1,
              children: [],
              direction: null,
            },
          },
          _status: 'published',
        },
      }),
    ).rejects.toThrow()
  })
})
