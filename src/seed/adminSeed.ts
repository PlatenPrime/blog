/**
 * Admin bootstrap helpers (roadmap 040).
 * Pure logic is unit-tested; DB side lives in `src/scripts/seedAdmin.ts`.
 */

export const PLACEHOLDER_ADMIN_PASSWORD = 'replace-me'

export type AdminSeedEnv = {
  email: string
  password: string
}

export type AdminSeedDecision =
  { action: 'create'; email: string; password: string } | { action: 'skip'; reason: string }

/**
 * Read and validate ADMIN_EMAIL / ADMIN_PASSWORD.
 * Rejects missing values and the `.env.example` placeholder password.
 */
export function readAdminSeedEnv(
  env: Record<string, string | undefined> = process.env,
): AdminSeedEnv {
  const email = env.ADMIN_EMAIL?.trim() ?? ''
  const password = env.ADMIN_PASSWORD ?? ''

  if (!email) {
    throw new Error(
      'ADMIN_EMAIL is required. Add it to `.env` (see `.env.example`), then re-run `npm run seed:admin`.',
    )
  }

  if (!email.includes('@')) {
    throw new Error('ADMIN_EMAIL must be a valid email address.')
  }

  if (!password) {
    throw new Error(
      'ADMIN_PASSWORD is required. Add it to `.env` (see `.env.example`), then re-run `npm run seed:admin`.',
    )
  }

  if (password === PLACEHOLDER_ADMIN_PASSWORD) {
    throw new Error(
      `ADMIN_PASSWORD must not be the placeholder "${PLACEHOLDER_ADMIN_PASSWORD}". Set a real password in .env.`,
    )
  }

  return { email: email.toLowerCase(), password }
}

/**
 * Idempotent decision: create only when no admin exists and email is unused.
 */
export function decideAdminSeed(args: {
  email: string
  password: string
  existingAdminCount: number
  emailAlreadyTaken: boolean
}): AdminSeedDecision {
  if (args.existingAdminCount > 0) {
    return { action: 'skip', reason: 'An admin user already exists.' }
  }

  if (args.emailAlreadyTaken) {
    return {
      action: 'skip',
      reason: `User with email ${args.email} already exists (not creating a second account).`,
    }
  }

  return { action: 'create', email: args.email, password: args.password }
}
