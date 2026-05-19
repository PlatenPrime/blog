import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ShutdownModule } from '../shutdown/shutdown.module';
import { RequestTimeoutInterceptor } from './request-timeout.interceptor';
import { REQUEST_TIMEOUT_MS } from './request-timeout.tokens';

@Module({
  imports: [ShutdownModule],
  providers: [
    {
      provide: REQUEST_TIMEOUT_MS,
      useFactory: (config: ConfigService) =>
        config.get<number>('REQUEST_TIMEOUT_MS') ?? 30_000,
      inject: [ConfigService],
    },
    RequestTimeoutInterceptor,
  ],
  exports: [RequestTimeoutInterceptor, REQUEST_TIMEOUT_MS],
})
export class RequestLifecycleModule {}
