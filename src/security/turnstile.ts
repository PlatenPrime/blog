/**
 * Cloudflare Turnstile server verify (step 075).
 * Widget alone is not enough — actions must call `verifyTurnstileToken`.
 */

export const TURNSTILE_RESPONSE_FIELD = 'cf-turnstile-response'

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export type TurnstileVerifyResult = {
  ok: boolean
}

type TurnstileEnv = {
  siteKey: string
  secretKey: string
}

let warnedMissingTurnstile = false

function readTurnstileEnv(): TurnstileEnv | null {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? ''
  const secretKey = process.env.TURNSTILE_SECRET_KEY?.trim() ?? ''
  if (!siteKey || !secretKey) {
    return null
  }
  return { siteKey, secretKey }
}

/** True when both public site key and server secret are set. */
export function isTurnstileConfigured(): boolean {
  return readTurnstileEnv() !== null
}

function warnMissingTurnstileOnce(): void {
  if (warnedMissingTurnstile || process.env.NODE_ENV !== 'production') {
    return
  }
  warnedMissingTurnstile = true
  console.warn(
    '[turnstile] NEXT_PUBLIC_TURNSTILE_SITE_KEY / TURNSTILE_SECRET_KEY unset; bot checks skipped.',
  )
}

/**
 * Verify a Turnstile response token with Cloudflare siteverify.
 * When keys are unset (local/CI), returns `{ ok: true }` so forms keep working.
 */
export async function verifyTurnstileToken(options: {
  token: string
  ip?: string | null
}): Promise<TurnstileVerifyResult> {
  const env = readTurnstileEnv()
  if (!env) {
    warnMissingTurnstileOnce()
    return { ok: true }
  }

  const token = options.token.trim()
  if (!token) {
    return { ok: false }
  }

  const body = new URLSearchParams()
  body.set('secret', env.secretKey)
  body.set('response', token)
  const ip = options.ip?.trim()
  if (ip) {
    body.set('remoteip', ip)
  }

  try {
    const response = await fetch(SITEVERIFY_URL, {
      body,
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      method: 'POST',
    })
    if (!response.ok) {
      return { ok: false }
    }
    const data = (await response.json()) as { success?: boolean }
    return { ok: data.success === true }
  } catch {
    return { ok: false }
  }
}
