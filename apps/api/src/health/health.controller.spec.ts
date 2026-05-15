import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService } from '@nestjs/terminus';
import { PostgresHealthIndicator } from './indicators/postgres.health-indicator';
import { HealthController } from './health.controller';

const livenessOk = {
  status: 'ok',
  info: { api: { status: 'up' } },
  error: {},
  details: { api: { status: 'up' } },
} as const;

const readinessOk = {
  status: 'ok',
  info: { database: { status: 'up' } },
  error: {},
  details: { database: { status: 'up' } },
} as const;

type LivenessIndicator = () => Promise<{ api: { status: 'up' } }>;
type ReadinessIndicator = () => Promise<{ database: { status: 'up' } }>;

type HealthCheck = (
  indicators: (LivenessIndicator | ReadinessIndicator)[],
) => Promise<typeof livenessOk | typeof readinessOk>;

describe('HealthController', () => {
  let controller: HealthController;
  const checkMock = vi.fn<HealthCheck>();
  const isHealthyMock = vi.fn<PostgresHealthIndicator['isHealthy']>();

  beforeEach(async () => {
    checkMock.mockReset();
    isHealthyMock.mockReset();
    isHealthyMock.mockResolvedValue({ database: { status: 'up' } });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: { check: checkMock },
        },
        {
          provide: PostgresHealthIndicator,
          useValue: { isHealthy: isHealthyMock },
        },
      ],
    }).compile();

    controller = module.get(HealthController);
  });

  describe('liveness', () => {
    it('delegates to HealthCheckService with api liveness indicator', async () => {
      checkMock.mockResolvedValueOnce(livenessOk);

      await expect(controller.liveness()).resolves.toEqual(livenessOk);
      expect(checkMock).toHaveBeenCalledTimes(1);

      const indicators = checkMock.mock.calls[0]?.[0];
      expect(indicators).toHaveLength(1);

      const runIndicator = indicators?.[0];
      if (runIndicator === undefined) {
        throw new Error('expected liveness indicator');
      }
      await expect(runIndicator()).resolves.toEqual({
        api: { status: 'up' },
      });
    });
  });

  describe('readiness', () => {
    it('delegates to HealthCheckService with postgres database indicator', async () => {
      checkMock.mockImplementation(async (indicators) => {
        await Promise.all(indicators.map((run) => run()));
        return readinessOk;
      });

      await expect(controller.readiness()).resolves.toEqual(readinessOk);
      expect(checkMock).toHaveBeenCalledTimes(1);
      expect(isHealthyMock).toHaveBeenCalledWith('database');

      const indicators = checkMock.mock.calls[0]?.[0];
      expect(indicators).toHaveLength(1);

      const runIndicator = indicators?.[0];
      if (runIndicator === undefined) {
        throw new Error('expected readiness indicator');
      }
      await expect(runIndicator()).resolves.toEqual({
        database: { status: 'up' },
      });
    });
  });
});
