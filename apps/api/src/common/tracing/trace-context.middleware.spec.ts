import { context, trace } from '@opentelemetry/api';
import {
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TRACEPARENT_HEADER } from './trace-context.constants';
import {
  registerTracerProviderForTests,
  resetTracerProviderRegistrationForTests,
} from './register-noop-tracer-provider';
import { TraceContextMiddleware } from './trace-context.middleware';
import { OTEL_TRACER_NAME } from './tracing.constants';

const INCOMING_TRACEPARENT =
  '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';

describe('TraceContextMiddleware', () => {
  let exporter: InMemorySpanExporter;
  let middleware: TraceContextMiddleware;

  beforeEach(() => {
    resetTracerProviderRegistrationForTests();
    exporter = new InMemorySpanExporter();
    registerTracerProviderForTests([new SimpleSpanProcessor(exporter)]);

    const tracer = trace.getTracer(OTEL_TRACER_NAME);
    middleware = new TraceContextMiddleware(tracer);
  });

  afterEach(() => {
    exporter.reset();
    resetTracerProviderRegistrationForTests();
  });

  it('continues the trace from a valid traceparent header', () => {
    const req = {
      method: 'GET',
      path: '/health',
      headers: { [TRACEPARENT_HEADER]: INCOMING_TRACEPARENT },
    };
    const res = createMockResponse();
    const next = vi.fn(() => {
      const activeSpan = trace.getSpan(context.active());
      expect(activeSpan).toBeDefined();
      res.emit('finish');
    });

    middleware.use(req as never, res as never, next);

    expect(next).toHaveBeenCalledOnce();

    const spans = exporter.getFinishedSpans();
    expect(spans).toHaveLength(1);
    expect(spans[0]?.spanContext().traceId).toBe(
      '4bf92f3577b34da6a3ce929d0e0e4736',
    );
    expect(spans[0]?.parentSpanContext?.spanId).toBe('00f067aa0ba902b7');
    expect(spans[0]?.attributes['http.status_code']).toBe(200);
  });

  it('starts a new root span when traceparent is absent', () => {
    const req = {
      method: 'GET',
      path: '/',
      headers: {},
    };
    const res = createMockResponse();
    const next = vi.fn(() => {
      res.emit('finish');
    });

    middleware.use(req as never, res as never, next);

    const spans = exporter.getFinishedSpans();
    expect(spans).toHaveLength(1);
    expect(spans[0]?.parentSpanContext).toBeUndefined();
    expect(spans[0]?.spanContext().traceId).toMatch(/^[0-9a-f]{32}$/);
  });

  it('does not throw on an invalid traceparent header', () => {
    const req = {
      method: 'GET',
      path: '/',
      headers: { [TRACEPARENT_HEADER]: 'not-a-valid-traceparent' },
    };
    const res = createMockResponse();
    const next = vi.fn(() => {
      res.emit('finish');
    });

    expect(() =>
      middleware.use(req as never, res as never, next),
    ).not.toThrow();
    expect(next).toHaveBeenCalledOnce();
    expect(exporter.getFinishedSpans()).toHaveLength(1);
  });

  it('ends the span when the response finishes', () => {
    const req = {
      method: 'POST',
      path: '/examples',
      headers: {},
    };
    const res = createMockResponse();
    const next = vi.fn();

    middleware.use(req as never, res as never, next);

    expect(exporter.getFinishedSpans()).toHaveLength(0);

    res.statusCode = 201;
    res.emit('finish');

    const spans = exporter.getFinishedSpans();
    expect(spans).toHaveLength(1);
    expect(spans[0]?.attributes['http.status_code']).toBe(201);
  });
});

function createMockResponse(): {
  statusCode: number;
  once: (event: string, listener: () => void) => void;
  emit: (event: string) => void;
} {
  const listeners = new Map<string, () => void>();

  return {
    statusCode: 200,
    once(event: string, listener: () => void) {
      listeners.set(event, listener);
    },
    emit(event: string) {
      listeners.get(event)?.();
    },
  };
}
