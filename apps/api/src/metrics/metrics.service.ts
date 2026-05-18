import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { collectDefaultMetrics, Registry } from 'prom-client';
import { PROMETHEUS_REGISTRY } from './prometheus-registry.token';

@Injectable()
export class MetricsService implements OnModuleInit {
  constructor(
    @Inject(PROMETHEUS_REGISTRY) private readonly register: Registry,
  ) {}

  onModuleInit(): void {
    collectDefaultMetrics({ register: this.register });
  }

  getMetrics(): Promise<string> {
    return this.register.metrics();
  }
}
