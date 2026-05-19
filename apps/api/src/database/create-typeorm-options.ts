import type { DataSourceOptions } from 'typeorm';
import type { RootEnv } from '../config/env.schema';

/** Nest `TypeOrmModule.forRoot*` options (TypeORM datasource + Nest-only fields). */
export type TypeOrmRootOptions = DataSourceOptions & {
  autoLoadEntities?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
};

export type TypeOrmPostgresEnv = Pick<
  RootEnv,
  | 'POSTGRES_HOST'
  | 'POSTGRES_PORT'
  | 'POSTGRES_USER'
  | 'POSTGRES_PASSWORD'
  | 'POSTGRES_DB'
>;

export function createTypeOrmOptions(
  env: TypeOrmPostgresEnv,
): TypeOrmRootOptions {
  return {
    type: 'postgres',
    host: env.POSTGRES_HOST,
    port: env.POSTGRES_PORT,
    username: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    database: env.POSTGRES_DB,
    synchronize: false,
    autoLoadEntities: true,
    connectTimeoutMS: 3_000,
    retryAttempts: 3,
    retryDelay: 1_000,
  };
}
