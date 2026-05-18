import { Controller, Get, Header } from '@nestjs/common';
import { PROMETHEUS_CONTENT_TYPE } from './prometheus.constants';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  @Header('Content-Type', PROMETHEUS_CONTENT_TYPE)
  getMetrics(): Promise<string> {
    return this.metrics.getMetrics();
  }
}
