import type { INestApplication } from '@nestjs/common';
import { ApiShutdownCoordinator } from '../common/shutdown/api-shutdown-coordinator.service';

/** IPC payload from {@link scripts/shutdown-smoke.mjs} when OS signals are unreliable. */
export const GRACEFUL_SHUTDOWN_IPC_MESSAGE = 'graceful-shutdown';

/**
 * Enables Nest shutdown lifecycle without binding default SIGTERM/SIGINT handlers
 * (graceful drain is handled by {@link ApiShutdownCoordinator}).
 */
export function configureApiShutdown(app: INestApplication): void {
  app.enableShutdownHooks([]);
  app.get(ApiShutdownCoordinator).bindApplication(app);
}
