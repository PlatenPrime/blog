import { test as setup } from '@playwright/test'
import { getPayload } from 'payload'
import fs from 'node:fs'
import path from 'node:path'

import config from '../../src/payload.config'
import { createVerifiedReader, uniqueSuffix } from '../factories'

const authDir = path.join(process.cwd(), 'tests/e2e/.auth')
const userFile = path.join(authDir, 'reader.json')

setup('seed verified reader for auth e2e', async () => {
  const payload = await getPayload({ config })
  const password = 'e2e-password-123'
  const user = await createVerifiedReader(payload, {
    email: `e2e-reader-${uniqueSuffix()}@example.com`,
    password,
  })

  fs.mkdirSync(authDir, { recursive: true })
  fs.writeFileSync(userFile, JSON.stringify({ email: user.email, password }, null, 2))
})
