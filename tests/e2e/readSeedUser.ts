import fs from 'node:fs'
import path from 'node:path'

export type SeedUser = { email: string; password: string }

/** Credentials written by `auth.setup.ts` for hermetic login flows. */
export function readSeedUser(): SeedUser {
  const file = path.join(process.cwd(), 'tests/e2e/.auth/reader.json')
  return JSON.parse(fs.readFileSync(file, 'utf8')) as SeedUser
}
