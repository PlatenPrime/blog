import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

export const APPLICATION_SHUTDOWN_LOG_MESSAGE = 'application shutdown';

@Injectable()
export class ApiShutdownService implements OnApplicationShutdown {
  constructor(private readonly logger: Logger) {}

  onApplicationShutdown(signal?: string): void {
    this.logger.log(
      { signal: signal ?? null },
      APPLICATION_SHUTDOWN_LOG_MESSAGE,
    );
  }
}
