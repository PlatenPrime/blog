/**
 * CLI: seed first admin from ADMIN_EMAIL + ADMIN_PASSWORD (roadmap 040).
 *
 *   npm run seed:admin
 *
 * Idempotent: skips when an admin already exists or the email is taken.
 */
import 'dotenv/config'

import { getPayload } from 'payload'

import config from '../payload.config'
import { decideAdminSeed, readAdminSeedEnv } from '../seed/adminSeed'

async function main(): Promise<void> {
  const { email, password } = readAdminSeedEnv()
  const payload = await getPayload({ config })

  const { totalDocs: existingAdminCount } = await payload.find({
    collection: 'users',
    where: { role: { equals: 'admin' } },
    limit: 0,
    overrideAccess: true,
  })

  const { totalDocs: emailMatches } = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 0,
    overrideAccess: true,
  })

  const decision = decideAdminSeed({
    email,
    password,
    existingAdminCount,
    emailAlreadyTaken: emailMatches > 0,
  })

  if (decision.action === 'skip') {
    payload.logger.info(`seed:admin — skip: ${decision.reason}`)
    return
  }

  await payload.create({
    collection: 'users',
    data: {
      email: decision.email,
      password: decision.password,
      role: 'admin',
    },
    overrideAccess: true,
  })

  payload.logger.info(`seed:admin — created admin ${decision.email}`)
}

main().catch((error: unknown) => {
  console.error('seed:admin failed:', error)
  process.exitCode = 1
})
