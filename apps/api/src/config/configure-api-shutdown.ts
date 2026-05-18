import type { INestApplication } from '@nestjs/common';

/** IPC payload from {@link scripts/shutdown-smoke.mjs} when OS signals are unreliable. */
export const GRACEFUL_SHUTDOWN_IPC_MESSAGE = 'graceful-shutdown';

/**
 * Enables Nest lifecycle hooks on SIGTERM/SIGINT (HTTP drain, module destroy).
 * Registers explicit handlers so shutdown works in non-TTY subprocesses (e.g. Windows smoke).
 */
export function configureApiShutdown(app: INestApplication): void {
  app.enableShutdownHooks();

  let isClosing = false;

  const shutdown = () => {
    if (isClosing) {
      return;
    }
    isClosing = true;
    void app.close().finally(() => {
      process.exit(0);
    });
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);

  if (typeof process.send === 'function') {
    process.on('message', (message: unknown) => {
      if (message === GRACEFUL_SHUTDOWN_IPC_MESSAGE) {
        shutdown();
      }
    });
  }
}
