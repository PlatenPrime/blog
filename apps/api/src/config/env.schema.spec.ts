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
    });
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
