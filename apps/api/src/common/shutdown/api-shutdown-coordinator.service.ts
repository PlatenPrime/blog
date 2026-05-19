import {
  Injectable,
  type INestApplication,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { GRACEFUL_SHUTDOWN_IPC_MESSAGE } from '../../config/configure-api-shutdown';
import { InFlightRequestsService } from './in-flight-requests.service';

export const SHUTDOWN_GRACE_STARTED_MESSAGE = 'shutdown grace period started';
export const SHUTDOWN_GRACE_EXCEEDED_MESSAGE = 'shutdown grace period exceeded';

@Injectable()
export class ApiShutdownCoordinator implements OnModuleDestroy {
  private app: INestApplication | null = null;
  private isShuttingDown = false;
  private isClosing = false;
  private handlersRegistered = false;

  private readonly onSigint = () => {
    void this.initiateShutdown('SIGINT');
  };

  private readonly onSigterm = () => {
    void this.initiateShutdown('SIGTERM');
  };

  private readonly onIpcMessage = (message: unknown) => {
    if (message === GRACEFUL_SHUTDOWN_IPC_MESSAGE) {
      void this.initiateShutdown('IPC');
    }
  };

  constructor(
    private readonly config: ConfigService,
    private readonly inFlight: InFlightRequestsService,
    private readonly logger: Logger,
  ) {}

  bindApplication(app: INestApplication): void {
    if (this.app !== null) {
      return;
    }

    this.app = app;
    this.registerSignalHandlers();
  }

  isServerShuttingDown(): boolean {
    return this.isShuttingDown;
  }

  onModuleDestroy(): void {
    this.removeSignalHandlers();
  }

  private registerSignalHandlers(): void {
    if (this.handlersRegistered) {
      return;
    }

    this.handlersRegistered = true;
    process.once('SIGINT', this.onSigint);
    process.once('SIGTERM', this.onSigterm);

    if (typeof process.send === 'function') {
      process.on('message', this.onIpcMessage);
    }
  }

  private removeSignalHandlers(): void {
    if (!this.handlersRegistered) {
      return;
    }

    process.off('SIGINT', this.onSigint);
    process.off('SIGTERM', this.onSigterm);
    process.off('message', this.onIpcMessage);
    this.handlersRegistered = false;
  }

  async initiateShutdown(signal: string): Promise<void> {
    if (this.isClosing) {
      return;
    }

    this.isClosing = true;
    this.isShuttingDown = true;

    const gracePeriodMs =
      this.config.get<number>('SHUTDOWN_GRACE_PERIOD_MS') ?? 10_000;

    this.logger.log(
      {
        signal,
        gracePeriodMs,
        inFlight: this.inFlight.inFlightCount,
      },
      SHUTDOWN_GRACE_STARTED_MESSAGE,
    );

    const drained = await this.inFlight.waitUntilDrained(gracePeriodMs);

    if (!drained) {
      this.logger.warn(
        {
          signal,
          gracePeriodMs,
          inFlight: this.inFlight.inFlightCount,
        },
        SHUTDOWN_GRACE_EXCEEDED_MESSAGE,
      );
      process.exit(1);
      return;
    }

    if (this.app !== null) {
      await this.app.close();
    }

    process.exit(0);
  }
}
