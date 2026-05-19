import { describe, expect, it } from 'vitest';
import { createTypeOrmOptions } from './create-typeorm-options';

describe('createTypeOrmOptions', () => {
  it('maps POSTGRES_* to postgres DataSource options with Nest extras', () => {
    expect(
      createTypeOrmOptions({
        POSTGRES_HOST: 'db.local',
        POSTGRES_PORT: 5433,
        POSTGRES_USER: 'app',
        POSTGRES_PASSWORD: 'secret',
        POSTGRES_DB: 'blog_test',
      }),
    ).toEqual({
      type: 'postgres',
      host: 'db.local',
      port: 5433,
      username: 'app',
      password: 'secret',
      database: 'blog_test',
      synchronize: false,
      autoLoadEntities: true,
      connectTimeoutMS: 3_000,
      retryAttempts: 3,
      retryDelay: 1_000,
    });
  });

  it('keeps synchronize disabled for migration-driven schema', () => {
    expect(
      createTypeOrmOptions({
        POSTGRES_HOST: '127.0.0.1',
        POSTGRES_PORT: 5432,
        POSTGRES_USER: 'blog',
        POSTGRES_PASSWORD: 'blog',
        POSTGRES_DB: 'blog_dev',
      }).synchronize,
    ).toBe(false);
  });
});
