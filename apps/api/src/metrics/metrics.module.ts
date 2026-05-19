import { Module } from '@nestjs/common';
import { Registry } from 'prom-client';
import { HttpRequestMetricsService } from './http-request-metrics.service';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { PROMETHEUS_REGISTRY } from './prometheus-registry.token';

@Module({
  controllers: [MetricsController],
  providers: [
    {
      provide: PROMETHEUS_REGISTRY,
      useFactory: (): Registry => new Registry(),
    },
    MetricsService,
    HttpRequestMetricsService,
  ],
  exports: [HttpRequestMetricsService],
})
export class MetricsModule {}
