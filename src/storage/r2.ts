import { s3Storage } from '@payloadcms/storage-s3'
import type { Plugin } from 'payload'

/**
 * R2 env contract (roadmap 037). All required for S3 plugin; otherwise local disk.
 */
export type R2Env = {
  bucket: string
  accessKeyId: string
  secretAccessKey: string
  endpoint: string
  publicUrl: string
  region: string
}

/** Loose env map so unit tests can pass partial objects. */
export type EnvLike = Record<string, string | undefined>

function trimEnv(value: string | undefined): string {
  return value?.trim() ?? ''
}

/**
 * True when every required R2 variable is set (local disk otherwise).
 */
export function isR2Configured(env: EnvLike = process.env): boolean {
  return Boolean(
    trimEnv(env.R2_BUCKET) &&
    trimEnv(env.R2_ACCESS_KEY_ID) &&
    trimEnv(env.R2_SECRET_ACCESS_KEY) &&
    trimEnv(env.R2_ENDPOINT) &&
    trimEnv(env.R2_PUBLIC_URL),
  )
}

export function readR2Env(env: EnvLike = process.env): R2Env | null {
  if (!isR2Configured(env)) return null

  return {
    bucket: trimEnv(env.R2_BUCKET),
    accessKeyId: trimEnv(env.R2_ACCESS_KEY_ID),
    secretAccessKey: trimEnv(env.R2_SECRET_ACCESS_KEY),
    endpoint: trimEnv(env.R2_ENDPOINT).replace(/\/$/, ''),
    publicUrl: trimEnv(env.R2_PUBLIC_URL).replace(/\/$/, ''),
    region: trimEnv(env.R2_REGION) || 'auto',
  }
}

/**
 * Payload S3 storage plugin for Cloudflare R2.
 * Always registered with `enabled: isR2Configured()` so importMap includes client upload
 * handlers; when disabled, Media keeps local `staticDir`.
 */
export function createR2StoragePlugin(env: EnvLike = process.env): Plugin {
  const r2 = readR2Env(env)
  const enabled = r2 != null
  const publicUrl = r2?.publicUrl ?? ''

  return s3Storage({
    enabled,
    // Bypass Vercel ~4.5MB server body limit; bucket CORS must allow the site origin.
    clientUploads: true,
    collections: {
      media: {
        // Media.read is public; serve via R2 public URL (r2.dev or custom domain).
        disablePayloadAccessControl: true,
        generateFileURL: ({ filename, prefix }) => {
          const key = prefix ? `${prefix}/${filename}` : filename
          if (!publicUrl) return `/api/media/file/${filename}`
          return `${publicUrl}/${key}`
        },
      },
    },
    bucket: r2?.bucket || 'r2-not-configured',
    config: {
      credentials: {
        accessKeyId: r2?.accessKeyId || 'r2-not-configured',
        secretAccessKey: r2?.secretAccessKey || 'r2-not-configured',
      },
      region: r2?.region || 'auto',
      ...(r2?.endpoint ? { endpoint: r2.endpoint } : {}),
      forcePathStyle: true,
    },
  })
}
