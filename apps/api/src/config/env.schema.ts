import { z } from 'zod';
import {
  DEFAULT_LOGIN_LOCKOUT_DURATION_MS,
  DEFAULT_LOGIN_LOCKOUT_MAX_ATTEMPTS,
  DEFAULT_LOGIN_LOCKOUT_WINDOW_MS,
} from '../auth/login-lockout.constants';
import { DEFAULT_REFRESH_TOKEN_TTL_MS } from '../auth/refresh-token.constants';
import {
  buildDatabaseUrlFromPostgres,
  isPostgresDatabaseUrl,
} from './build-database-url';
import {
  DEFAULT_OTEL_SERVICE_NAME,
  DEFAULT_OTEL_TRACES_EXPORTER,
  OTEL_TRACES_EXPORTER_VALUES,
} from './otel-env';

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

/** Safe dev default; override via `.env` in any shared environment. */
const DEFAULT_JWT_SECRET =
  'dev-only-jwt-secret-change-before-production-32chars';

function jwtSecret() {
  return z
    .union([z.string(), z.undefined()])
    .transform((raw) => {
      if (raw === undefined || raw === '') {
        return DEFAULT_JWT_SECRET;
      }
      const s = String(raw).trim();
      return s.length === 0 ? DEFAULT_JWT_SECRET : s;
    })
    .pipe(z.string().min(32));
}

function jwtAccessExpiresIn() {
  return z
    .union([z.string(), z.undefined()])
    .transform((raw) => {
      if (raw === undefined || raw === '') {
        return '15m';
      }
      const s = String(raw).trim();
      return s.length === 0 ? '15m' : s;
    })
    .pipe(z.string().min(1));
}

function envMilliseconds(
  defaultWhenEmpty: number,
  bounds: { readonly min: number; readonly max: number },
) {
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
    return '__INVALID_ENV_MS__';
  }, z.coerce.number().int().min(bounds.min).max(bounds.max));
}

/**
 * Environment keys mirrored by the root `.env.example`.
 * Validated once at Nest bootstrap via {@link ConfigModule}.
 */
const logLevelSchema = z.enum([
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'fatal',
  'silent',
]);

export const rootEnvSchema = z
  .object({
    PORT: envTcpPort(4000),
    LOG_LEVEL: z
      .union([logLevelSchema, z.string(), z.undefined()])
      .transform((raw) => {
        if (raw === undefined || raw === '') {
          return 'info' as const;
        }
        const normalized = String(raw).trim().toLowerCase();
        const parsed = logLevelSchema.safeParse(normalized);
        if (!parsed.success) {
          return '__INVALID_LOG_LEVEL__';
        }
        return parsed.data;
      })
      .pipe(logLevelSchema),
    CORS_ORIGINS: z
      .union([z.string(), z.undefined()])
      .transform((raw) => (raw === undefined ? '' : String(raw))),
    POSTGRES_HOST: postgresNonEmpty('127.0.0.1'),
    POSTGRES_USER: postgresNonEmpty('blog'),
    POSTGRES_PASSWORD: postgresNonEmpty('blog'),
    POSTGRES_DB: postgresNonEmpty('blog_dev'),
    POSTGRES_PORT: envTcpPort(5432),
    DATABASE_URL: z.union([z.string(), z.undefined()]).optional(),
    REQUEST_TIMEOUT_MS: envMilliseconds(30_000, { min: 1_000, max: 300_000 }),
    SHUTDOWN_GRACE_PERIOD_MS: envMilliseconds(10_000, {
      min: 1_000,
      max: 120_000,
    }),
    OTEL_SERVICE_NAME: z
      .string()
      .optional()
      .transform((raw) => {
        if (raw === undefined || raw.trim() === '') {
          return DEFAULT_OTEL_SERVICE_NAME;
        }
        return raw.trim();
      })
      .pipe(z.string().min(1)),
    OTEL_TRACES_EXPORTER: z
      .union([z.enum(OTEL_TRACES_EXPORTER_VALUES), z.string(), z.undefined()])
      .transform((raw) => {
        if (raw === undefined || raw === '') {
          return DEFAULT_OTEL_TRACES_EXPORTER;
        }
        const normalized = String(raw).trim().toLowerCase();
        const parsed = z
          .enum(OTEL_TRACES_EXPORTER_VALUES)
          .safeParse(normalized);
        if (!parsed.success) {
          return '__INVALID_OTEL_TRACES_EXPORTER__';
        }
        return parsed.data;
      })
      .pipe(z.enum(OTEL_TRACES_EXPORTER_VALUES)),
    OTEL_EXPORTER_OTLP_ENDPOINT: z
      .string()
      .optional()
      .transform((raw) => {
        if (raw === undefined) {
          return undefined;
        }
        const trimmed = raw.trim();
        return trimmed.length === 0 ? undefined : trimmed;
      }),
    JWT_SECRET: jwtSecret(),
    JWT_ACCESS_EXPIRES_IN: jwtAccessExpiresIn(),
    JWT_REFRESH_EXPIRES_MS: envMilliseconds(DEFAULT_REFRESH_TOKEN_TTL_MS, {
      min: 3_600_000,
      max: 7_776_000_000,
    }),
    LOGIN_LOCKOUT_MAX_ATTEMPTS: z.preprocess((val: unknown) => {
      if (val === undefined || val === '') {
        return DEFAULT_LOGIN_LOCKOUT_MAX_ATTEMPTS;
      }
      if (typeof val === 'number') {
        return val;
      }
      if (typeof val === 'string') {
        const s = val.trim();
        return s.length === 0 ? DEFAULT_LOGIN_LOCKOUT_MAX_ATTEMPTS : s;
      }
      return '__INVALID_LOGIN_LOCKOUT_MAX_ATTEMPTS__';
    }, z.coerce.number().int().min(1).max(100)),
    LOGIN_LOCKOUT_WINDOW_MS: envMilliseconds(DEFAULT_LOGIN_LOCKOUT_WINDOW_MS, {
      min: 60_000,
      max: 86_400_000,
    }),
    LOGIN_LOCKOUT_DURATION_MS: envMilliseconds(
      DEFAULT_LOGIN_LOCKOUT_DURATION_MS,
      { min: 60_000, max: 86_400_000 },
    ),
  })
  .transform((value) => {
    const explicit =
      value.DATABASE_URL === undefined ? '' : String(value.DATABASE_URL).trim();
    const DATABASE_URL =
      explicit.length > 0
        ? explicit
        : buildDatabaseUrlFromPostgres({
            POSTGRES_HOST: value.POSTGRES_HOST,
            POSTGRES_PORT: value.POSTGRES_PORT,
            POSTGRES_USER: value.POSTGRES_USER,
            POSTGRES_PASSWORD: value.POSTGRES_PASSWORD,
            POSTGRES_DB: value.POSTGRES_DB,
          });
    return { ...value, DATABASE_URL };
  })
  .superRefine((value, ctx) => {
    if (!isPostgresDatabaseUrl(value.DATABASE_URL)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'DATABASE_URL must use postgresql:// or postgres:// scheme',
        path: ['DATABASE_URL'],
      });
    }
    if (
      value.OTEL_TRACES_EXPORTER === 'otlp' &&
      !value.OTEL_EXPORTER_OTLP_ENDPOINT
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'OTEL_EXPORTER_OTLP_ENDPOINT is required when OTEL_TRACES_EXPORTER=otlp',
        path: ['OTEL_EXPORTER_OTLP_ENDPOINT'],
      });
    }
  });

export type RootEnv = z.infer<typeof rootEnvSchema>;

const ROOT_ENV_KEYS = [
  'PORT',
  'LOG_LEVEL',
  'CORS_ORIGINS',
  'POSTGRES_HOST',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'POSTGRES_DB',
  'POSTGRES_PORT',
  'DATABASE_URL',
  'REQUEST_TIMEOUT_MS',
  'SHUTDOWN_GRACE_PERIOD_MS',
  'OTEL_SERVICE_NAME',
  'OTEL_TRACES_EXPORTER',
  'OTEL_EXPORTER_OTLP_ENDPOINT',
  'JWT_SECRET',
  'JWT_ACCESS_EXPIRES_IN',
  'JWT_REFRESH_EXPIRES_MS',
  'LOGIN_LOCKOUT_MAX_ATTEMPTS',
  'LOGIN_LOCKOUT_WINDOW_MS',
  'LOGIN_LOCKOUT_DURATION_MS',
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
