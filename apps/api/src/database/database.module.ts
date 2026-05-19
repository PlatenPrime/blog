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
          DATABASE_URL: config.getOrThrow('DATABASE_URL', { infer: true }),
        }),
    }),
  ],
})
export class DatabaseModule {}
