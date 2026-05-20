import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createCliDataSourceOptions,
  createTypeOrmOptions,
} from './create-typeorm-options';

const databaseUrl = 'postgresql://app:secret@db.local:5433/blog_test';

describe('createTypeOrmOptions', () => {
  it('maps DATABASE_URL to postgres DataSource options with Nest extras', () => {
    expect(createTypeOrmOptions({ DATABASE_URL: databaseUrl })).toEqual({
      type: 'postgres',
      url: databaseUrl,
      synchronize: false,
      connectTimeoutMS: 3_000,
      autoLoadEntities: true,
      retryAttempts: 3,
      retryDelay: 1_000,
    });
  });

  it('keeps synchronize disabled for migration-driven schema', () => {
    expect(
      createTypeOrmOptions({
        DATABASE_URL: 'postgresql://blog:blog@127.0.0.1:5432/blog_dev',
      }).synchronize,
    ).toBe(false);
  });
});

describe('createCliDataSourceOptions', () => {
  it('maps DATABASE_URL with migrations glob and entity glob for CLI', () => {
    expect(createCliDataSourceOptions({ DATABASE_URL: databaseUrl })).toEqual({
      type: 'postgres',
      url: databaseUrl,
      synchronize: false,
      connectTimeoutMS: 3_000,
      entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
      migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
      migrationsTableName: 'typeorm_migrations',
    });
  });

  it('does not enable autoLoadEntities for CLI', () => {
    expect(
      createCliDataSourceOptions({ DATABASE_URL: databaseUrl }),
    ).not.toHaveProperty('autoLoadEntities');
  });
});
