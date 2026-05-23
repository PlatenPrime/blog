import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { createApiValidationPipe } from './config/create-api-validation-pipe';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggingModule, RequestLoggingInterceptor } from './common/logging';
import {
  RequestLifecycleModule,
  RequestTimeoutInterceptor,
} from './common/request-lifecycle';
import { ShutdownModule } from './common/shutdown';
import { TraceContextMiddleware, TracingModule } from './common/tracing';
import {
  RequestContextModule,
  RequestIdMiddleware,
} from './common/request-context';
import { DatabaseModule } from './database';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics';
import { validateRootEnv } from './config/env.schema';
import { resolveEnvFilePaths } from './config/env-file-paths';
import { ApiExceptionFilter } from './errors/api-exception.filter';
import { AuthModule } from './auth/auth.module';
import { CmsModule } from './cms';
import { ExamplesModule } from './examples/examples.module';
import { RbacModule } from './rbac';
import { SecurityAuditModule } from './security-audit';
import { UsersModule } from './users';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolveEnvFilePaths(),
      validate: validateRootEnv,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.getOrThrow<number>('GLOBAL_THROTTLE_TTL_MS'),
          limit: config.getOrThrow<number>('GLOBAL_THROTTLE_LIMIT'),
        },
      ],
    }),
    RequestContextModule,
    TracingModule,
    LoggingModule,
    ShutdownModule,
    RequestLifecycleModule,
    DatabaseModule,
    UsersModule,
    RbacModule,
    SecurityAuditModule,
    AuthModule,
    CmsModule,
    HealthModule,
    MetricsModule,
    ExamplesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
    },
    {
      provide: APP_PIPE,
      useFactory: createApiValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestTimeoutInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TraceContextMiddleware, RequestIdMiddleware).forRoutes('*');
  }
}
