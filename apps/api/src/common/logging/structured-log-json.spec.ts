import { Writable } from 'node:stream';
import pino from 'pino';
import { describe, expect, it } from 'vitest';
import { RequestContextStore } from '../request-context/request-context.store';
import { API_SERVICE_NAME } from './logging.constants';
import { createPinoOptions } from './create-pino-options';

type StructuredLogLine = {
  level: number;
  time: number;
  msg: string;
  service: string;
  pid: number;
  requestId?: string;
  err?: { type?: string; message?: string; stack?: string };
};

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
    readLastLine(): StructuredLogLine {
      const line = chunks.at(-1)?.trim();
      if (!line) {
        throw new Error('expected a log line');
      }
      return JSON.parse(line) as StructuredLogLine;
    },
  };
}

describe('structured log JSON shape', () => {
  it('emits required fields without request context', () => {
    const requestContextStore = new RequestContextStore();
    const capture = createCapturingLogger(requestContextStore);

    capture.logger.info('test message');

    const line = capture.readLastLine();
    expect(typeof line.level).toBe('number');
    expect(typeof line.time).toBe('number');
    expect(line.msg).toBe('test message');
    expect(line.service).toBe(API_SERVICE_NAME);
    expect(line.pid).toBe(process.pid);
    expect(line.requestId).toBeUndefined();
  });

  it('includes requestId from AsyncLocalStorage when present', () => {
    const requestContextStore = new RequestContextStore();
    const capture = createCapturingLogger(requestContextStore);

    requestContextStore.run({ requestId: 'req-1' }, () => {
      capture.logger.info('in request');
    });

    const line = capture.readLastLine();
    expect(line.msg).toBe('in request');
    expect(line.requestId).toBe('req-1');
  });

  it('serializes errors under err without top-level stack string', () => {
    const requestContextStore = new RequestContextStore();
    const capture = createCapturingLogger(requestContextStore);
    const error = new Error('boom');

    capture.logger.error({ err: error }, 'handler failed');

    const line = capture.readLastLine();
    expect(line.msg).toBe('handler failed');
    expect(line.err).toBeDefined();
    expect(line.err?.message).toBe('boom');
    expect(typeof line.err?.stack).toBe('string');
    expect((line as Record<string, unknown>).stack).toBeUndefined();
  });
});
