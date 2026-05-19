import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
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
import { ExamplesModule } from './examples/examples.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolveEnvFilePaths(),
      validate: validateRootEnv,
    }),
    RequestContextModule,
    TracingModule,
    LoggingModule,
    ShutdownModule,
    RequestLifecycleModule,
    DatabaseModule,
    HealthModule,
    MetricsModule,
    ExamplesModule,
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
