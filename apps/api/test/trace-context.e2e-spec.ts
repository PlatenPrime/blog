import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApiHttp } from './../src/config/configure-api-http';
import { enableApiCors } from './../src/config/enable-api-cors';
import {
  registerNoopTracerProvider,
  registerTracerProviderForTests,
  resetTracerProviderRegistrationForTests,
  TRACEPARENT_HEADER,
} from './../src/common/tracing';
import { PostgresHealthIndicator } from './../src/health/indicators/postgres.health-indicator';

const INCOMING_TRACEPARENT =
  '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';

describe('Trace context propagation (e2e)', () => {
  let app: INestApplication<App>;
  let exporter: InMemorySpanExporter;

  beforeEach(async () => {
    resetTracerProviderRegistrationForTests();
    exporter = new InMemorySpanExporter();
    registerTracerProviderForTests([new SimpleSpanProcessor(exporter)]);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PostgresHealthIndicator)
      .useValue({
        isHealthy: () => Promise.resolve({ database: { status: 'up' } }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    enableApiCors(app);
    configureApiHttp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    exporter.reset();
    resetTracerProviderRegistrationForTests();
    registerNoopTracerProvider();
  });

  it('continues the trace from an incoming traceparent header', async () => {
    await request(app.getHttpServer())
      .get('/health')
      .set(TRACEPARENT_HEADER, INCOMING_TRACEPARENT)
      .expect(200);

    const spans = exporter.getFinishedSpans();
    const httpSpan = spans.find((span) => span.name === 'HTTP GET');

    expect(httpSpan).toBeDefined();
    expect(httpSpan?.spanContext().traceId).toBe(
      '4bf92f3577b34da6a3ce929d0e0e4736',
    );
    expect(httpSpan?.parentSpanContext?.spanId).toBe('00f067aa0ba902b7');
    expect(httpSpan?.attributes['http.status_code']).toBe(200);
  });

  it('does not fail health checks when traceparent is absent', async () => {
    await request(app.getHttpServer()).get('/health').expect(200);

    const spans = exporter.getFinishedSpans();
    expect(spans.some((span) => span.name === 'HTTP GET')).toBe(true);
  });
});
