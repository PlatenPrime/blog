import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService } from '@nestjs/terminus';
import { HealthController } from './health.controller';

const livenessOk = {
  status: 'ok',
  info: { api: { status: 'up' } },
  error: {},
  details: { api: { status: 'up' } },
} as const;

type LivenessIndicator = () => Promise<{ api: { status: 'up' } }>;

type LivenessCheck = (
  indicators: LivenessIndicator[],
) => Promise<typeof livenessOk>;

describe('HealthController', () => {
  let controller: HealthController;
  const checkMock = vi.fn<LivenessCheck>();

  beforeEach(async () => {
    checkMock.mockReset();
    checkMock.mockResolvedValue(livenessOk);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: { check: checkMock },
        },
      ],
    }).compile();

    controller = module.get(HealthController);
  });

  describe('liveness', () => {
    it('delegates to HealthCheckService with api liveness indicator', async () => {
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
});
