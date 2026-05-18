import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { RequestContextModule } from '../request-context/request-context.module';
import { RequestContextStore } from '../request-context/request-context.store';
import { createPinoOptions } from './create-pino-options';
import type { LogLevel } from './logging.constants';

@Global()
@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [ConfigModule, RequestContextModule],
      inject: [ConfigService, RequestContextStore],
      useFactory: (
        config: ConfigService,
        requestContextStore: RequestContextStore,
      ) => ({
        pinoHttp: {
          ...createPinoOptions({
            level: config.get<LogLevel>('LOG_LEVEL') ?? 'info',
            requestContextStore,
          }),
          autoLogging: false,
        },
      }),
    }),
  ],
  exports: [LoggerModule],
})
export class LoggingModule {}
