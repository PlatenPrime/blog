import type { NextFunction, Request, Response } from 'express';
import { CORRELATION_ID_RESPONSE_HEADER } from './correlation-id.constants';
import { RequestContextStore } from './request-context.store';
import { RequestIdMiddleware } from './request-id.middleware';
import { REQUEST_ID_RESPONSE_HEADER } from './request-id.constants';

describe('RequestIdMiddleware', () => {
  const requestContextStore = new RequestContextStore();
  const middleware = new RequestIdMiddleware(requestContextStore);

  function createMocks(options?: {
    readonly requestId?: string;
    readonly correlationId?: string;
    readonly forwardedFor?: string;
    readonly userAgent?: string;
  }) {
    const headers: Record<string, string | undefined> = {};

    if (options?.requestId !== undefined) {
      headers['x-request-id'] = options.requestId;
    }

    if (options?.correlationId !== undefined) {
      headers['x-correlation-id'] = options.correlationId;
    }

    if (options?.forwardedFor !== undefined) {
      headers['x-forwarded-for'] = options.forwardedFor;
    }

    if (options?.userAgent !== undefined) {
      headers['user-agent'] = options.userAgent;
    }

    const req = { headers } as Request;
    const setHeader = vi.fn();
    const res = { setHeader } as unknown as Response;
    const nextMock = vi.fn<(err?: unknown) => void>();
    const next = nextMock as unknown as NextFunction;

    return { req, res, setHeader, next, nextMock };
  }

  it('sets response header and stores request id in ALS', () => {
    const { req, res, setHeader, next, nextMock } = createMocks({
      requestId: 'client-trace-1',
    });

    middleware.use(req, res, next);

    expect(setHeader).toHaveBeenCalledWith(
      REQUEST_ID_RESPONSE_HEADER,
      'client-trace-1',
    );
    expect(setHeader).toHaveBeenCalledWith(
      CORRELATION_ID_RESPONSE_HEADER,
      'client-trace-1',
    );
    expect(nextMock).toHaveBeenCalledTimes(1);
    expect(requestContextStore.getRequestId()).toBeUndefined();
  });

  it('populates ALS for the duration of next()', () => {
    const { req, res, next, nextMock } = createMocks({
      requestId: 'als-check-id',
    });
    let requestIdDuringNext: string | undefined;
    let correlationIdDuringNext: string | undefined;

    nextMock.mockImplementation(() => {
      requestIdDuringNext = requestContextStore.getRequestId();
      correlationIdDuringNext = requestContextStore.getCorrelationId();
    });

    middleware.use(req, res, next);

    expect(requestIdDuringNext).toBe('als-check-id');
    expect(correlationIdDuringNext).toBe('als-check-id');
    expect(requestContextStore.getRequestId()).toBeUndefined();
  });

  it('populates client metadata for the duration of next()', () => {
    const { req, res, next, nextMock } = createMocks({
      requestId: 'client-metadata-id',
      forwardedFor: '203.0.113.10, 10.0.0.2',
      userAgent: 'Mozilla/5.0 test browser',
    });
    let ipAddressDuringNext: string | undefined;
    let userAgentDuringNext: string | undefined;

    nextMock.mockImplementation(() => {
      ipAddressDuringNext = requestContextStore.getIpAddress();
      userAgentDuringNext = requestContextStore.getUserAgent();
    });

    middleware.use(req, res, next);

    expect(ipAddressDuringNext).toBe('203.0.113.10');
    expect(userAgentDuringNext).toBe('Mozilla/5.0 test browser');
    expect(requestContextStore.getIpAddress()).toBeUndefined();
    expect(requestContextStore.getUserAgent()).toBeUndefined();
  });

  it('echoes client correlation id when valid', () => {
    const { req, res, setHeader, next, nextMock } = createMocks({
      requestId: 'req-1',
      correlationId: 'corr-client-1',
    });

    middleware.use(req, res, next);

    expect(setHeader).toHaveBeenCalledWith(REQUEST_ID_RESPONSE_HEADER, 'req-1');
    expect(setHeader).toHaveBeenCalledWith(
      CORRELATION_ID_RESPONSE_HEADER,
      'corr-client-1',
    );
    expect(nextMock).toHaveBeenCalledTimes(1);
  });

  it('generates request id when incoming header is invalid', () => {
    const { req, res, setHeader, next, nextMock } = createMocks({
      requestId: 'not valid!!!',
    });

    middleware.use(req, res, next);

    const generatedId = setHeader.mock.calls[0]?.[1] as string;

    expect(generatedId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(setHeader).toHaveBeenCalledWith(
      CORRELATION_ID_RESPONSE_HEADER,
      generatedId,
    );
    expect(nextMock).toHaveBeenCalledTimes(1);
  });
});
