import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import {
  CORRELATION_ID_HEADER,
  CORRELATION_ID_RESPONSE_HEADER,
} from './correlation-id.constants';
import { RequestContextStore } from './request-context.store';
import { resolveCorrelationId } from './resolve-correlation-id';
import { resolveRequestId } from './resolve-request-id';
import {
  REQUEST_ID_HEADER,
  REQUEST_ID_RESPONSE_HEADER,
} from './request-id.constants';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  constructor(private readonly requestContextStore: RequestContextStore) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = resolveRequestId(req.headers[REQUEST_ID_HEADER]);
    const correlationId = resolveCorrelationId(
      req.headers[CORRELATION_ID_HEADER],
      requestId,
    );

    res.setHeader(REQUEST_ID_RESPONSE_HEADER, requestId);
    res.setHeader(CORRELATION_ID_RESPONSE_HEADER, correlationId);
    this.requestContextStore.run({ requestId, correlationId }, () => next());
  }
}
