import { describe, expect, it } from 'vitest';
import { createTypeOrmOptions } from './create-typeorm-options';

describe('createTypeOrmOptions', () => {
  it('maps DATABASE_URL to postgres DataSource options with Nest extras', () => {
    expect(
      createTypeOrmOptions({
        DATABASE_URL: 'postgresql://app:secret@db.local:5433/blog_test',
      }),
    ).toEqual({
      type: 'postgres',
      url: 'postgresql://app:secret@db.local:5433/blog_test',
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
        DATABASE_URL: 'postgresql://blog:blog@127.0.0.1:5432/blog_dev',
      }).synchronize,
    ).toBe(false);
  });
});
