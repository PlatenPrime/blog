import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { createApiValidationPipe } from './config/create-api-validation-pipe';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { validateRootEnv } from './config/env.schema';
import { resolveEnvFilePaths } from './config/env-file-paths';
import { ApiExceptionFilter } from './errors/api-exception.filter';
import { ValidationModule } from './validation/validation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolveEnvFilePaths(),
      validate: validateRootEnv,
    }),
    HealthModule,
    ValidationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
    },
    {
      provide: APP_PIPE,
      useFactory: createApiValidationPipe,
    },
  ],
})
export class AppModule {}
