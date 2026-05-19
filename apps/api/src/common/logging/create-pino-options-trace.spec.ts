import { Writable } from 'node:stream';
import { context, trace } from '@opentelemetry/api';
import pino from 'pino';
import { afterEach, describe, expect, it } from 'vitest';
import { RequestContextStore } from '../request-context/request-context.store';
import {
  registerTracerProviderForTests,
  resetTracerProviderRegistrationForTests,
} from '../tracing/register-tracer-provider';
import { OTEL_TRACER_NAME } from '../tracing/tracing.constants';
import { createPinoOptions } from './create-pino-options';

function createCapturingLogger(requestContextStore: RequestContextStore) {
  const chunks: string[] = [];
  const stream = new Writable({
    write(chunk: Buffer | string, _encoding, callback) {
      chunks.push(typeof chunk === 'string' ? chunk : chunk.toString('utf8'));
      callback();
    },
  });

  const logger = pino(
    createPinoOptions({
      level: 'info',
      requestContextStore,
    }),
    stream,
  );

  return {
    logger,
    readLastLine(): { traceId?: string; spanId?: string } {
      const line = chunks.at(-1)?.trim();
      if (!line) {
        throw new Error('expected a log line');
      }
      return JSON.parse(line) as { traceId?: string; spanId?: string };
    },
  };
}

describe('createPinoOptions trace correlation', () => {
  afterEach(() => {
    resetTracerProviderRegistrationForTests();
  });

  it('adds traceId and spanId from the active span', () => {
    registerTracerProviderForTests([]);
    const store = new RequestContextStore();
    const capture = createCapturingLogger(store);
    const tracer = trace.getTracer(OTEL_TRACER_NAME);
    const span = tracer.startSpan('log-correlation');

    context.with(trace.setSpan(context.active(), span), () => {
      capture.logger.info('inside request');
    });

    span.end();

    const line = capture.readLastLine();
    expect(line.traceId).toBe(span.spanContext().traceId);
    expect(line.spanId).toBe(span.spanContext().spanId);
  });
});
