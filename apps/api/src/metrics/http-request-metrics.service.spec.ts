import { Registry } from 'prom-client';
import { describe, expect, it } from 'vitest';
import {
  HTTP_REQUEST_DURATION_SECONDS,
  HttpRequestMetricsService,
} from './http-request-metrics.service';

describe('HttpRequestMetricsService', () => {
  it('records observations on the dedicated registry', async () => {
    const registry = new Registry();
    const service = new HttpRequestMetricsService(registry);

    service.observe({
      method: 'GET',
      route: '/api/v1/examples',
      statusCode: 200,
      durationSeconds: 0.042,
    });

    const body = await registry.metrics();
    expect(body).toContain(`# TYPE ${HTTP_REQUEST_DURATION_SECONDS} histogram`);
    expect(body).toContain('method="GET"');
    expect(body).toContain('route="/api/v1/examples"');
    expect(body).toContain('status_code="200"');
  });
});
