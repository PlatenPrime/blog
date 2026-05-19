import { describe, expect, it } from 'vitest';
import { buildDatabaseUrlFromPostgres } from './build-database-url';

describe('buildDatabaseUrlFromPostgres', () => {
  it('builds postgresql URL from POSTGRES_* parts', () => {
    expect(
      buildDatabaseUrlFromPostgres({
        POSTGRES_HOST: '127.0.0.1',
        POSTGRES_PORT: 5432,
        POSTGRES_USER: 'blog',
        POSTGRES_PASSWORD: 'blog',
        POSTGRES_DB: 'blog_dev',
      }),
    ).toBe('postgresql://blog:blog@127.0.0.1:5432/blog_dev');
  });

  it('percent-encodes special characters in user and password', () => {
    expect(
      buildDatabaseUrlFromPostgres({
        POSTGRES_HOST: 'db.local',
        POSTGRES_PORT: 5433,
        POSTGRES_USER: 'user@host',
        POSTGRES_PASSWORD: 'p@ss:word',
        POSTGRES_DB: 'blog_test',
      }),
    ).toBe('postgresql://user%40host:p%40ss%3Aword@db.local:5433/blog_test');
  });
});
