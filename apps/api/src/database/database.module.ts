import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { RootEnv } from '../config/env.schema';
import { createTypeOrmOptions } from './create-typeorm-options';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<RootEnv, true>) =>
        createTypeOrmOptions({
          POSTGRES_HOST: config.getOrThrow('POSTGRES_HOST', { infer: true }),
          POSTGRES_PORT: config.getOrThrow('POSTGRES_PORT', { infer: true }),
          POSTGRES_USER: config.getOrThrow('POSTGRES_USER', { infer: true }),
          POSTGRES_PASSWORD: config.getOrThrow('POSTGRES_PASSWORD', {
            infer: true,
          }),
          POSTGRES_DB: config.getOrThrow('POSTGRES_DB', { infer: true }),
        }),
    }),
  ],
})
export class DatabaseModule {}
