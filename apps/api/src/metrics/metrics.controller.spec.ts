import { Test, TestingModule } from '@nestjs/testing';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

describe('MetricsController', () => {
  let controller: MetricsController;
  const getMetricsMock = vi.fn<MetricsService['getMetrics']>();

  beforeEach(async () => {
    getMetricsMock.mockReset();
    getMetricsMock.mockResolvedValue('# HELP process_cpu_user_seconds_total\n');

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [
        {
          provide: MetricsService,
          useValue: { getMetrics: getMetricsMock },
        },
      ],
    }).compile();

    controller = module.get(MetricsController);
  });

  it('delegates to MetricsService.getMetrics', async () => {
    await expect(controller.getMetrics()).resolves.toContain('# HELP');
    expect(getMetricsMock).toHaveBeenCalledTimes(1);
  });
});
