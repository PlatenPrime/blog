import type { NextFunction, Request, Response } from 'express';
import { RequestContextStore } from './request-context.store';
import { RequestIdMiddleware } from './request-id.middleware';
import { REQUEST_ID_RESPONSE_HEADER } from './request-id.constants';

describe('RequestIdMiddleware', () => {
  const requestContextStore = new RequestContextStore();
  const middleware = new RequestIdMiddleware(requestContextStore);

  function createMocks(headerValue?: string) {
    const headers: Record<string, string | undefined> = {};

    if (headerValue !== undefined) {
      headers['x-request-id'] = headerValue;
    }

    const req = { headers } as Request;
    const setHeader = vi.fn();
    const res = { setHeader } as unknown as Response;
    const nextMock = vi.fn<(err?: unknown) => void>();
    const next = nextMock as unknown as NextFunction;

    return { req, res, setHeader, next, nextMock };
  }

  it('sets response header and stores request id in ALS', () => {
    const { req, res, setHeader, next, nextMock } =
      createMocks('client-trace-1');

    middleware.use(req, res, next);

    expect(setHeader).toHaveBeenCalledWith(
      REQUEST_ID_RESPONSE_HEADER,
      'client-trace-1',
    );
    expect(nextMock).toHaveBeenCalledTimes(1);
    expect(requestContextStore.getRequestId()).toBeUndefined();
  });

  it('populates ALS for the duration of next()', () => {
    const { req, res, next, nextMock } = createMocks('als-check-id');
    let requestIdDuringNext: string | undefined;

    nextMock.mockImplementation(() => {
      requestIdDuringNext = requestContextStore.getRequestId();
    });

    middleware.use(req, res, next);

    expect(requestIdDuringNext).toBe('als-check-id');
    expect(requestContextStore.getRequestId()).toBeUndefined();
  });

  it('generates request id when incoming header is invalid', () => {
    const { req, res, setHeader, next, nextMock } = createMocks('not valid!!!');

    middleware.use(req, res, next);

    const generatedId = setHeader.mock.calls[0]?.[1] as string;

    expect(generatedId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(nextMock).toHaveBeenCalledTimes(1);
  });
});
