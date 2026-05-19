import { Inject, Injectable } from '@nestjs/common';
import { Histogram, type Registry } from 'prom-client';
import { PROMETHEUS_REGISTRY } from './prometheus-registry.token';

export const HTTP_REQUEST_DURATION_SECONDS = 'http_request_duration_seconds';

const HTTP_REQUEST_DURATION_BUCKETS = [
  0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
] as const;

export type ObserveHttpRequestParams = {
  readonly method: string;
  readonly route: string;
  readonly statusCode: number;
  readonly durationSeconds: number;
};

@Injectable()
export class HttpRequestMetricsService {
  private readonly histogram: Histogram<string>;

  constructor(@Inject(PROMETHEUS_REGISTRY) registry: Registry) {
    this.histogram = new Histogram({
      name: HTTP_REQUEST_DURATION_SECONDS,
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'] as const,
      buckets: [...HTTP_REQUEST_DURATION_BUCKETS],
      registers: [registry],
    });
  }

  observe(params: ObserveHttpRequestParams): void {
    this.histogram
      .labels(params.method, params.route, String(params.statusCode))
      .observe(params.durationSeconds);
  }
}
