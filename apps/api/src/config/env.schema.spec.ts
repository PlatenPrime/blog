import { describe, expect, it } from 'vitest';
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
