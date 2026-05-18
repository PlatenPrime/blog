import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { RequestContextStore } from './request-context.store';
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

    res.setHeader(REQUEST_ID_RESPONSE_HEADER, requestId);
    this.requestContextStore.run({ requestId }, () => next());
  }
}
