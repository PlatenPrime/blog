import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import type { Pool } from 'pg';
import type { RootEnv } from '../config/env.schema';
import { createPostgresPool } from './create-postgres-pool';
import { PostgresHealthIndicator } from './indicators/postgres.health-indicator';
import { HealthController } from './health.controller';
import { PG_POOL } from './pg-pool.token';
import { PostgresPoolLifecycle } from './postgres-pool.lifecycle';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [
    {
      provide: PG_POOL,
      useFactory: (config: ConfigService<RootEnv, true>): Pool =>
        createPostgresPool({
          POSTGRES_HOST: config.getOrThrow('POSTGRES_HOST', { infer: true }),
          POSTGRES_PORT: config.getOrThrow('POSTGRES_PORT', { infer: true }),
          POSTGRES_USER: config.getOrThrow('POSTGRES_USER', { infer: true }),
          POSTGRES_PASSWORD: config.getOrThrow('POSTGRES_PASSWORD', {
            infer: true,
          }),
          POSTGRES_DB: config.getOrThrow('POSTGRES_DB', { infer: true }),
        }),
      inject: [ConfigService],
    },
    PostgresHealthIndicator,
    PostgresPoolLifecycle,
  ],
})
export class HealthModule {}
