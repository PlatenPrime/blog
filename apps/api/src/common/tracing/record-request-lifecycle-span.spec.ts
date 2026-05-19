import { context, trace } from '@opentelemetry/api';
import {
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { afterEach, describe, expect, it } from 'vitest';
import {
  ERROR_TYPE_ATTRIBUTE,
  HTTP_CLIENT_ABORTED_ATTRIBUTE,
  HTTP_REQUEST_TIMEOUT_ATTRIBUTE,
  recordRequestLifecycleSpanEvent,
} from './record-request-lifecycle-span';
import {
  registerTracerProviderForTests,
  resetTracerProviderRegistrationForTests,
} from './register-tracer-provider';
import { OTEL_TRACER_NAME } from './tracing.constants';

describe('recordRequestLifecycleSpanEvent', () => {
  const exporter = new InMemorySpanExporter();

  afterEach(() => {
    exporter.reset();
    resetTracerProviderRegistrationForTests();
  });

  it('records timeout attributes on the active span', () => {
    registerTracerProviderForTests([new SimpleSpanProcessor(exporter)]);
    const tracer = trace.getTracer(OTEL_TRACER_NAME);
    const span = tracer.startSpan('http-request');

    context.with(trace.setSpan(context.active(), span), () => {
      recordRequestLifecycleSpanEvent('timeout');
    });

    span.end();

    const finished = exporter.getFinishedSpans();
    expect(finished).toHaveLength(1);
    expect(finished[0]?.attributes[HTTP_REQUEST_TIMEOUT_ATTRIBUTE]).toBe(true);
    expect(finished[0]?.attributes[ERROR_TYPE_ATTRIBUTE]).toBe('timeout');
  });

  it('records client abort attributes on the active span', () => {
    registerTracerProviderForTests([new SimpleSpanProcessor(exporter)]);
    const tracer = trace.getTracer(OTEL_TRACER_NAME);
    const span = tracer.startSpan('http-request');

    context.with(trace.setSpan(context.active(), span), () => {
      recordRequestLifecycleSpanEvent('client_abort');
    });

    span.end();

    const finished = exporter.getFinishedSpans();
    expect(finished).toHaveLength(1);
    expect(finished[0]?.attributes[HTTP_CLIENT_ABORTED_ATTRIBUTE]).toBe(true);
  });
});
