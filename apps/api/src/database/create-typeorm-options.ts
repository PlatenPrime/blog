import type { DataSourceOptions } from 'typeorm';
import type { RootEnv } from '../config/env.schema';

/** Nest `TypeOrmModule.forRoot*` options (TypeORM datasource + Nest-only fields). */
export type TypeOrmRootOptions = DataSourceOptions & {
  autoLoadEntities?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
};

export type TypeOrmDatabaseEnv = Pick<RootEnv, 'DATABASE_URL'>;

export function createTypeOrmOptions(
  env: TypeOrmDatabaseEnv,
): TypeOrmRootOptions {
  return {
    type: 'postgres',
    url: env.DATABASE_URL,
    synchronize: false,
    autoLoadEntities: true,
    connectTimeoutMS: 3_000,
    retryAttempts: 3,
    retryDelay: 1_000,
  };
}
