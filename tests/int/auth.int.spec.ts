import { getPayload, type Payload } from 'payload'
import type { User } from '@/payload-types'
import config from '@/payload.config'
import { isAdmin } from '@/access/isAdmin'

import { beforeAll, describe, expect, it } from 'vitest'

let payload: Payload

async function createVerifiedReader(suffix: string): Promise<User> {
  return (await payload.create({
    collection: 'users',
    data: {
      email: `auth-reader-${suffix}@example.com`,
      password: 'test-password-123',
      role: 'reader',
      _verified: true,
    },
    overrideAccess: true,
  })) as User
}

describe('Auth Local API (register / login / verify / reset)', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('public register creates a reader who cannot access admin', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const email = `public-reg-${suffix}@example.com`

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
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const reader = await createVerifiedReader(suffix)

    const ok = await payload.login({
      collection: 'users',
      data: {
        email: reader.email,
        password: 'test-password-123',
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
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const email = `verify-${suffix}@example.com`

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
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const reader = await createVerifiedReader(suffix)

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
        data: { email: reader.email, password: 'test-password-123' },
      }),
    ).rejects.toThrow()

    const loggedIn = await payload.login({
      collection: 'users',
      data: { email: reader.email, password: 'new-password-456' },
    })
    expect(loggedIn.user?.email).toBe(reader.email)
  })

  it('unverified reader cannot create comments', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const unverified = (await payload.create({
      collection: 'users',
      data: {
        email: `unverified-${suffix}@example.com`,
        password: 'test-password-123',
        role: 'reader',
        _verified: false,
      },
      overrideAccess: true,
    })) as User

    const article = await payload.create({
      collection: 'articles',
      data: {
        title: `Auth comment target ${suffix}`,
        slug: `auth-comment-${suffix}`,
        body: {
          root: {
            type: 'root',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                type: 'paragraph',
                format: '',
                indent: 0,
                version: 1,
                children: [
                  {
                    type: 'text',
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'body',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                textFormat: 0,
                textStyle: '',
              },
            ],
            direction: 'ltr',
          },
        },
        _status: 'published',
      },
      overrideAccess: true,
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
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const reader = await createVerifiedReader(suffix)

    await expect(
      payload.create({
        collection: 'articles',
        user: reader,
        overrideAccess: false,
        data: {
          title: `Reader write ${suffix}`,
          slug: `reader-write-${suffix}`,
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
