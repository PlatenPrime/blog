import type { INestApplication } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiShutdownCoordinator,
  SHUTDOWN_GRACE_EXCEEDED_MESSAGE,
  SHUTDOWN_GRACE_STARTED_MESSAGE,
} from './api-shutdown-coordinator.service';
import type { InFlightRequestsService } from './in-flight-requests.service';

describe('ApiShutdownCoordinator', () => {
  const exitSpy = vi
    .spyOn(process, 'exit')
    .mockImplementation(() => undefined as never);

  beforeEach(() => {
    exitSpy.mockClear();
  });

  afterEach(() => {
    exitSpy.mockClear();
  });

  function createCoordinator(params: {
    readonly drained?: boolean;
    readonly gracePeriodMs?: number;
  }) {
    const waitUntilDrained = vi.fn().mockResolvedValue(params.drained ?? true);
    const inFlight = {
      inFlightCount: 2,
      waitUntilDrained,
    } as unknown as InFlightRequestsService;

    const logger = {
      log: vi.fn(),
      warn: vi.fn(),
    };

    const close = vi.fn().mockResolvedValue(undefined);
    const app = { close } as unknown as INestApplication;

    const coordinator = new ApiShutdownCoordinator(
      {
        get: (key: string) =>
          key === 'SHUTDOWN_GRACE_PERIOD_MS'
            ? (params.gracePeriodMs ?? 10_000)
            : undefined,
      } as never,
      inFlight,
      logger as never,
    );

    coordinator.bindApplication(app);

    return { coordinator, waitUntilDrained, close, logger, app };
  }

  it('binds application only once', () => {
    const { coordinator, app } = createCoordinator({});

    coordinator.bindApplication(app);

    expect(coordinator.isServerShuttingDown()).toBe(false);
  });

  it('drains in-flight requests then closes the app and exits 0', async () => {
    const { coordinator, waitUntilDrained, close, logger } = createCoordinator({
      drained: true,
    });

    await coordinator.initiateShutdown('SIGTERM');

    expect(coordinator.isServerShuttingDown()).toBe(true);
    expect(waitUntilDrained).toHaveBeenCalledWith(10_000);
    expect(logger.log).toHaveBeenCalledWith(
      expect.objectContaining({ signal: 'SIGTERM', gracePeriodMs: 10_000 }),
      SHUTDOWN_GRACE_STARTED_MESSAGE,
    );
    expect(close).toHaveBeenCalledTimes(1);
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('force-exits with code 1 when grace period is exceeded', async () => {
    const { coordinator, waitUntilDrained, close, logger } = createCoordinator({
      drained: false,
    });

    await coordinator.initiateShutdown('SIGTERM');

    expect(coordinator.isServerShuttingDown()).toBe(true);
    expect(waitUntilDrained).toHaveBeenCalledWith(10_000);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ signal: 'SIGTERM' }),
      SHUTDOWN_GRACE_EXCEEDED_MESSAGE,
    );
    expect(close).not.toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('ignores duplicate shutdown attempts', async () => {
    const { coordinator, waitUntilDrained, close } = createCoordinator({
      drained: true,
    });

    await coordinator.initiateShutdown('SIGTERM');
    await coordinator.initiateShutdown('SIGTERM');

    expect(waitUntilDrained).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
    expect(exitSpy).toHaveBeenCalledTimes(1);
  });
});
