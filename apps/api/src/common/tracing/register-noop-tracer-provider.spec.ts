import { context, propagation, trace } from '@opentelemetry/api';
import { afterEach, describe, expect, it } from 'vitest';
import { OTEL_TRACER_NAME } from './tracing.constants';
import {
  areTracingGlobalsConfiguredForTests,
  isTracerProviderRegistered,
  registerNoopTracerProvider,
  resetTracerProviderRegistrationForTests,
} from './register-noop-tracer-provider';

describe('registerNoopTracerProvider', () => {
  afterEach(() => {
    resetTracerProviderRegistrationForTests();
  });

  it('registers tracing globals, tracer provider, and allows starting spans', () => {
    registerNoopTracerProvider();

    expect(isTracerProviderRegistered()).toBe(true);
    expect(areTracingGlobalsConfiguredForTests()).toBe(true);
    expect(propagation.fields()).toContain('traceparent');

    const tracer = trace.getTracer(OTEL_TRACER_NAME);
    const span = tracer.startSpan('test-span');

    expect(() => span.end()).not.toThrow();
  });

  it('is idempotent when called more than once', () => {
    registerNoopTracerProvider();
    registerNoopTracerProvider();

    expect(isTracerProviderRegistered()).toBe(true);

    const tracer = trace.getTracer(OTEL_TRACER_NAME);
    const span = tracer.startSpan('idempotent-span');

    expect(() => span.end()).not.toThrow();
  });

  it('keeps context manager active across nested context.with calls', () => {
    registerNoopTracerProvider();

    const tracer = trace.getTracer(OTEL_TRACER_NAME);
    const outerSpan = tracer.startSpan('outer');

    context.with(trace.setSpan(context.active(), outerSpan), () => {
      const innerSpan = tracer.startSpan('inner');

      context.with(trace.setSpan(context.active(), innerSpan), () => {
        expect(trace.getSpan(context.active())?.spanContext().spanId).toBe(
          innerSpan.spanContext().spanId,
        );
      });

      innerSpan.end();
    });

    outerSpan.end();
  });
});
