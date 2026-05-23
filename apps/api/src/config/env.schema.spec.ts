import { describe, expect, it } from 'vitest';
import {
  DEFAULT_AUTH_SENSITIVE_RATE_DURATION_MS,
  DEFAULT_AUTH_SENSITIVE_RATE_MAX_ATTEMPTS,
  DEFAULT_AUTH_SENSITIVE_RATE_WINDOW_MS,
} from '../auth/auth-sensitive-rate-limit.constants';
import {
  DEFAULT_GLOBAL_THROTTLE_LIMIT,
  DEFAULT_GLOBAL_THROTTLE_TTL_MS,
} from './global-throttle.constants';
import {
  DEFAULT_LOGIN_LOCKOUT_DURATION_MS,
  DEFAULT_LOGIN_LOCKOUT_MAX_ATTEMPTS,
  DEFAULT_LOGIN_LOCKOUT_WINDOW_MS,
} from '../auth/login-lockout.constants';
import { DEFAULT_REFRESH_TOKEN_TTL_MS } from '../auth/refresh-token.constants';
import { parseRootEnv, validateRootEnv } from './env.schema';

describe('parseRootEnv', () => {
  it('applies documented defaults when keys are missing', () => {
    const env = parseRootEnv({});
    expect(env).toMatchObject({
      PORT: 4000,
      LOG_LEVEL: 'info',
      CORS_ORIGINS: '',
      POSTGRES_HOST: '127.0.0.1',
      POSTGRES_USER: 'blog',
      POSTGRES_PASSWORD: 'blog',
      POSTGRES_DB: 'blog_dev',
      POSTGRES_PORT: 5432,
      DATABASE_URL: 'postgresql://blog:blog@127.0.0.1:5432/blog_dev',
      REQUEST_TIMEOUT_MS: 30_000,
      SHUTDOWN_GRACE_PERIOD_MS: 10_000,
      JWT_SECRET: 'dev-only-jwt-secret-change-before-production-32chars',
      JWT_ACCESS_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_MS: DEFAULT_REFRESH_TOKEN_TTL_MS,
      LOGIN_LOCKOUT_MAX_ATTEMPTS: DEFAULT_LOGIN_LOCKOUT_MAX_ATTEMPTS,
      LOGIN_LOCKOUT_WINDOW_MS: DEFAULT_LOGIN_LOCKOUT_WINDOW_MS,
      LOGIN_LOCKOUT_DURATION_MS: DEFAULT_LOGIN_LOCKOUT_DURATION_MS,
      AUTH_SENSITIVE_RATE_MAX_ATTEMPTS:
        DEFAULT_AUTH_SENSITIVE_RATE_MAX_ATTEMPTS,
      AUTH_SENSITIVE_RATE_WINDOW_MS: DEFAULT_AUTH_SENSITIVE_RATE_WINDOW_MS,
      AUTH_SENSITIVE_RATE_DURATION_MS: DEFAULT_AUTH_SENSITIVE_RATE_DURATION_MS,
      GLOBAL_THROTTLE_TTL_MS: DEFAULT_GLOBAL_THROTTLE_TTL_MS,
      GLOBAL_THROTTLE_LIMIT: DEFAULT_GLOBAL_THROTTLE_LIMIT,
      SMTP_HOST: '',
      SMTP_PORT: 1025,
      SMTP_SECURE: false,
      SMTP_USER: '',
      SMTP_PASSWORD: '',
      SMTP_FROM: 'noreply@blog.local',
      APP_PUBLIC_BASE_URL: '',
      EMAIL_RETURN_TOKEN_IN_RESPONSE: false,
    });
  });

  it('parses LOGIN_LOCKOUT env overrides', () => {
    expect(
      parseRootEnv({
        LOGIN_LOCKOUT_MAX_ATTEMPTS: '3',
        LOGIN_LOCKOUT_WINDOW_MS: '120000',
        LOGIN_LOCKOUT_DURATION_MS: '180000',
      }),
    ).toMatchObject({
      LOGIN_LOCKOUT_MAX_ATTEMPTS: 3,
      LOGIN_LOCKOUT_WINDOW_MS: 120_000,
      LOGIN_LOCKOUT_DURATION_MS: 180_000,
    });
  });

  it('rejects LOGIN_LOCKOUT_MAX_ATTEMPTS below minimum', () => {
    expect(() => parseRootEnv({ LOGIN_LOCKOUT_MAX_ATTEMPTS: '0' })).toThrow(
      /LOGIN_LOCKOUT_MAX_ATTEMPTS/,
    );
  });

  it('parses AUTH_SENSITIVE_RATE env overrides', () => {
    expect(
      parseRootEnv({
        AUTH_SENSITIVE_RATE_MAX_ATTEMPTS: '5',
        AUTH_SENSITIVE_RATE_WINDOW_MS: '600000',
        AUTH_SENSITIVE_RATE_DURATION_MS: '900000',
      }),
    ).toMatchObject({
      AUTH_SENSITIVE_RATE_MAX_ATTEMPTS: 5,
      AUTH_SENSITIVE_RATE_WINDOW_MS: 600_000,
      AUTH_SENSITIVE_RATE_DURATION_MS: 900_000,
    });
  });

  it('rejects AUTH_SENSITIVE_RATE_MAX_ATTEMPTS below minimum', () => {
    expect(() =>
      parseRootEnv({ AUTH_SENSITIVE_RATE_MAX_ATTEMPTS: '0' }),
    ).toThrow(/AUTH_SENSITIVE_RATE_MAX_ATTEMPTS/);
  });

  it('parses GLOBAL_THROTTLE env overrides', () => {
    expect(
      parseRootEnv({
        GLOBAL_THROTTLE_LIMIT: '50',
        GLOBAL_THROTTLE_TTL_MS: '120000',
      }),
    ).toMatchObject({
      GLOBAL_THROTTLE_LIMIT: 50,
      GLOBAL_THROTTLE_TTL_MS: 120_000,
    });
  });

  it('rejects GLOBAL_THROTTLE_LIMIT below minimum', () => {
    expect(() => parseRootEnv({ GLOBAL_THROTTLE_LIMIT: '0' })).toThrow(
      /GLOBAL_THROTTLE_LIMIT/,
    );
  });

  it('parses JWT_ACCESS_EXPIRES_IN override', () => {
    expect(parseRootEnv({ JWT_ACCESS_EXPIRES_IN: '1h' })).toMatchObject({
      JWT_ACCESS_EXPIRES_IN: '1h',
    });
  });

  it('treats empty JWT_ACCESS_EXPIRES_IN as default 15m', () => {
    expect(parseRootEnv({ JWT_ACCESS_EXPIRES_IN: '' })).toMatchObject({
      JWT_ACCESS_EXPIRES_IN: '15m',
    });
  });

  it('parses JWT_REFRESH_EXPIRES_MS override', () => {
    expect(parseRootEnv({ JWT_REFRESH_EXPIRES_MS: '86400000' })).toMatchObject({
      JWT_REFRESH_EXPIRES_MS: 86_400_000,
    });
  });

  it('treats empty JWT_REFRESH_EXPIRES_MS as default 30 days', () => {
    expect(parseRootEnv({ JWT_REFRESH_EXPIRES_MS: '' })).toMatchObject({
      JWT_REFRESH_EXPIRES_MS: DEFAULT_REFRESH_TOKEN_TTL_MS,
    });
  });

  it('rejects JWT_REFRESH_EXPIRES_MS below minimum', () => {
    expect(() => parseRootEnv({ JWT_REFRESH_EXPIRES_MS: '1000' })).toThrow(
      /JWT_REFRESH_EXPIRES_MS/,
    );
  });

  it('rejects JWT_REFRESH_EXPIRES_MS above maximum', () => {
    expect(() =>
      parseRootEnv({ JWT_REFRESH_EXPIRES_MS: '99999999999' }),
    ).toThrow(/JWT_REFRESH_EXPIRES_MS/);
  });

  it('rejects JWT_SECRET shorter than 32 characters', () => {
    expect(() => parseRootEnv({ JWT_SECRET: 'too-short' })).toThrow(
      /JWT_SECRET/,
    );
  });

  it('trims JWT_SECRET before length check', () => {
    expect(
      parseRootEnv({
        JWT_SECRET: '  custom-jwt-secret-with-enough-characters-32  ',
      }),
    ).toMatchObject({
      JWT_SECRET: 'custom-jwt-secret-with-enough-characters-32',
    });
  });

  it('parses REQUEST_TIMEOUT_MS and SHUTDOWN_GRACE_PERIOD_MS', () => {
    expect(
      parseRootEnv({
        REQUEST_TIMEOUT_MS: '5000',
        SHUTDOWN_GRACE_PERIOD_MS: '15000',
      }),
    ).toMatchObject({
      REQUEST_TIMEOUT_MS: 5000,
      SHUTDOWN_GRACE_PERIOD_MS: 15_000,
    });
  });

  it('treats empty REQUEST_TIMEOUT_MS as default 30000', () => {
    expect(parseRootEnv({ REQUEST_TIMEOUT_MS: '' })).toMatchObject({
      REQUEST_TIMEOUT_MS: 30_000,
    });
  });

  it('rejects REQUEST_TIMEOUT_MS below minimum', () => {
    expect(() => parseRootEnv({ REQUEST_TIMEOUT_MS: '500' })).toThrow(
      /REQUEST_TIMEOUT_MS/,
    );
  });

  it('rejects SHUTDOWN_GRACE_PERIOD_MS above maximum', () => {
    expect(() => parseRootEnv({ SHUTDOWN_GRACE_PERIOD_MS: '999999' })).toThrow(
      /SHUTDOWN_GRACE_PERIOD_MS/,
    );
  });

  it('parses PORT and POSTGRES_PORT as integers', () => {
    expect(
      parseRootEnv({
        PORT: '8080',
        POSTGRES_PORT: '5433',
      }),
    ).toMatchObject({ PORT: 8080, POSTGRES_PORT: 5433 });
  });

  it('treats empty PORT as default 4000', () => {
    expect(parseRootEnv({ PORT: '' })).toMatchObject({ PORT: 4000 });
  });

  it('treats empty POSTGRES_PORT as default 5432', () => {
    expect(parseRootEnv({ POSTGRES_PORT: '' })).toMatchObject({
      POSTGRES_PORT: 5432,
    });
  });

  it('rejects non-numeric PORT', () => {
    expect(() => parseRootEnv({ PORT: 'nope' })).toThrow(/PORT/);
  });

  it('rejects PORT out of range', () => {
    expect(() => parseRootEnv({ PORT: '70000' })).toThrow(/PORT/);
  });

  it('parses LOG_LEVEL case-insensitively', () => {
    expect(parseRootEnv({ LOG_LEVEL: 'WARN' })).toMatchObject({
      LOG_LEVEL: 'warn',
    });
  });

  it('rejects invalid LOG_LEVEL', () => {
    expect(() => parseRootEnv({ LOG_LEVEL: 'verbose' })).toThrow(/LOG_LEVEL/);
  });

  it('passes through CORS_ORIGINS string', () => {
    expect(
      parseRootEnv({ CORS_ORIGINS: 'http://localhost:3000,http://a.test' }),
    ).toMatchObject({
      CORS_ORIGINS: 'http://localhost:3000,http://a.test',
    });
  });

  it('builds DATABASE_URL from POSTGRES_* when unset', () => {
    expect(parseRootEnv({})).toMatchObject({
      DATABASE_URL: 'postgresql://blog:blog@127.0.0.1:5432/blog_dev',
    });
  });

  it('uses explicit DATABASE_URL over POSTGRES_* defaults', () => {
    expect(
      parseRootEnv({
        DATABASE_URL: 'postgresql://app:secret@db.example:5433/app_db',
        POSTGRES_HOST: 'ignored.local',
      }),
    ).toMatchObject({
      DATABASE_URL: 'postgresql://app:secret@db.example:5433/app_db',
    });
  });

  it('treats empty DATABASE_URL as built from POSTGRES_*', () => {
    expect(parseRootEnv({ DATABASE_URL: '  ' })).toMatchObject({
      DATABASE_URL: 'postgresql://blog:blog@127.0.0.1:5432/blog_dev',
    });
  });

  it('accepts postgres:// scheme', () => {
    expect(
      parseRootEnv({
        DATABASE_URL: 'postgres://blog:blog@127.0.0.1:5432/blog_dev',
      }),
    ).toMatchObject({
      DATABASE_URL: 'postgres://blog:blog@127.0.0.1:5432/blog_dev',
    });
  });

  it('rejects DATABASE_URL with non-postgres scheme', () => {
    expect(() =>
      parseRootEnv({
        DATABASE_URL: 'mysql://blog:blog@127.0.0.1:5432/blog_dev',
      }),
    ).toThrow(/DATABASE_URL/);
  });
});

describe('validateRootEnv (Nest ConfigModule hook)', () => {
  it('returns parsed values and ignores unrelated keys', () => {
    const out = validateRootEnv({
      PORT: '3001',
      PATH: '/usr/bin',
      CORS_ORIGINS: '',
    });
    expect(out.PORT).toBe(3001);
    expect(out.PATH).toBeUndefined();
  });

  it('throws with a clear message when PORT is invalid', () => {
    expect(() => validateRootEnv({ PORT: 'abc' })).toThrow(
      /Invalid environment configuration/,
    );
  });
});
