import { Test, TestingModule } from '@nestjs/testing';
import { Registry } from 'prom-client';
import { MetricsService } from './metrics.service';
import { PROMETHEUS_REGISTRY } from './prometheus-registry.token';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(async () => {
    const register = new Registry();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsService,
        {
          provide: PROMETHEUS_REGISTRY,
          useValue: register,
        },
      ],
    }).compile();

    service = module.get(MetricsService);
  });

  it('collects default metrics on module init', async () => {
    service.onModuleInit();

    const body = await service.getMetrics();
    expect(body).toContain('# HELP');
    expect(body).toContain('# TYPE');
    expect(body).toMatch(/process_/);
  });
});
