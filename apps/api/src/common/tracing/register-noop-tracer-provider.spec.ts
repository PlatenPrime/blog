import { trace } from '@opentelemetry/api';
import { afterEach, describe, expect, it } from 'vitest';
import { OTEL_TRACER_NAME } from './tracing.constants';
import {
  isTracerProviderRegistered,
  registerNoopTracerProvider,
  resetTracerProviderRegistrationForTests,
} from './register-noop-tracer-provider';

describe('registerNoopTracerProvider', () => {
  afterEach(() => {
    resetTracerProviderRegistrationForTests();
  });

  it('registers a tracer provider and allows starting spans', () => {
    expect(isTracerProviderRegistered()).toBe(false);

    registerNoopTracerProvider();

    expect(isTracerProviderRegistered()).toBe(true);

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
});
