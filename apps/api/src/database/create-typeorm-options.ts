import { join } from 'node:path';
import type { DataSourceOptions } from 'typeorm';
import type { RootEnv } from '../config/env.schema';

/** Nest `TypeOrmModule.forRoot*` options (TypeORM datasource + Nest-only fields). */
export type TypeOrmRootOptions = DataSourceOptions & {
  autoLoadEntities?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
};

export type TypeOrmDatabaseEnv = Pick<RootEnv, 'DATABASE_URL'>;

export function createBasePostgresOptions(
  env: TypeOrmDatabaseEnv,
): DataSourceOptions {
  return {
    type: 'postgres',
    url: env.DATABASE_URL,
    synchronize: false,
    connectTimeoutMS: 3_000,
  };
}

export function createTypeOrmOptions(
  env: TypeOrmDatabaseEnv,
): TypeOrmRootOptions {
  return {
    ...createBasePostgresOptions(env),
    autoLoadEntities: true,
    retryAttempts: 3,
    retryDelay: 1_000,
  };
}

export function createCliDataSourceOptions(
  env: TypeOrmDatabaseEnv,
): DataSourceOptions {
  return {
    ...createBasePostgresOptions(env),
    entities: [],
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
    migrationsTableName: 'typeorm_migrations',
  };
}
