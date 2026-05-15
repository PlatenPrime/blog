import { Pool, type PoolConfig } from 'pg';
import type { RootEnv } from '../config/env.schema';

export type PostgresPoolEnv = Pick<
  RootEnv,
  | 'POSTGRES_HOST'
  | 'POSTGRES_PORT'
  | 'POSTGRES_USER'
  | 'POSTGRES_PASSWORD'
  | 'POSTGRES_DB'
>;

export function createPostgresPool(env: PostgresPoolEnv): Pool {
  const config: PoolConfig = {
    host: env.POSTGRES_HOST,
    port: env.POSTGRES_PORT,
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    database: env.POSTGRES_DB,
    max: 2,
    connectionTimeoutMillis: 3_000,
  };
  return new Pool(config);
}

export async function closePostgresPool(pool: Pool): Promise<void> {
  await pool.end();
}
