import { test as setup } from '@playwright/test'
import { getPayload } from 'payload'
import fs from 'node:fs'
import path from 'node:path'

import config from '../../src/payload.config'

const authDir = path.join(process.cwd(), 'tests/e2e/.auth')
const userFile = path.join(authDir, 'reader.json')

setup('seed verified reader for auth e2e', async () => {
  const payload = await getPayload({ config })
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const email = `e2e-reader-${suffix}@example.com`
  const password = 'e2e-password-123'

  await payload.create({
    collection: 'users',
    data: {
      email,
      password,
      role: 'reader',
      _verified: true,
    },
    overrideAccess: true,
  })

  fs.mkdirSync(authDir, { recursive: true })
  fs.writeFileSync(userFile, JSON.stringify({ email, password }, null, 2))
})
