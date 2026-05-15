import { z } from 'zod';

function envTcpPort(defaultWhenEmpty: number) {
  return z.preprocess((val: unknown) => {
    if (val === undefined || val === '') {
      return defaultWhenEmpty;
    }
    if (typeof val === 'number') {
      return val;
    }
    if (typeof val === 'string') {
      const s = val.trim();
      return s.length === 0 ? defaultWhenEmpty : s;
    }
    return '__INVALID_ENV_PORT__';
  }, z.coerce.number().int().min(1).max(65535));
}

function postgresNonEmpty(fallback: string) {
  return z
    .string()
    .optional()
    .transform((raw) => {
      if (raw === undefined) return fallback;
      const s = raw.trim();
      return s.length === 0 ? fallback : s;
    })
    .pipe(z.string().min(1));
}

/**
 * Environment keys mirrored by the root `.env.example`.
 * Validated once at Nest bootstrap via {@link ConfigModule}.
 */
export const rootEnvSchema = z.object({
  PORT: envTcpPort(4000),
  CORS_ORIGINS: z
    .union([z.string(), z.undefined()])
    .transform((raw) => (raw === undefined ? '' : String(raw))),
  POSTGRES_HOST: postgresNonEmpty('127.0.0.1'),
  POSTGRES_USER: postgresNonEmpty('blog'),
  POSTGRES_PASSWORD: postgresNonEmpty('blog'),
  POSTGRES_DB: postgresNonEmpty('blog_dev'),
  POSTGRES_PORT: envTcpPort(5432),
});

export type RootEnv = z.infer<typeof rootEnvSchema>;

const ROOT_ENV_KEYS = [
  'PORT',
  'CORS_ORIGINS',
  'POSTGRES_HOST',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'POSTGRES_DB',
  'POSTGRES_PORT',
] as const;

function pickRootEnvKeys(
  config: NodeJS.ProcessEnv | Record<string, unknown>,
): Record<string, unknown> {
  const picked: Record<string, unknown> = {};
  for (const key of ROOT_ENV_KEYS) {
    picked[key] = config[key];
  }
  return picked;
}

function formatZodIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
}

/**
 * Nest `ConfigModule` `validate` hook: fail fast with readable Zod errors.
 */
export function validateRootEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const result = rootEnvSchema.safeParse(pickRootEnvKeys(config));
  if (!result.success) {
    throw new Error(
      `Invalid environment configuration:\n${formatZodIssues(result.error)}`,
    );
  }
  return result.data;
}

/** Unit tests and tooling: parse a full `process.env`-like object. */
export function parseRootEnv(env: NodeJS.ProcessEnv): RootEnv {
  const picked = pickRootEnvKeys(env);
  return rootEnvSchema.parse(picked);
}
