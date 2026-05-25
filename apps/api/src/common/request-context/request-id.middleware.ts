import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { resolveClientIp } from '../../http/resolve-client-ip';
import {
  CORRELATION_ID_HEADER,
  CORRELATION_ID_RESPONSE_HEADER,
} from './correlation-id.constants';
import type { RequestContext } from './request-context.types';
import { RequestContextStore } from './request-context.store';
import { resolveCorrelationId } from './resolve-correlation-id';
import { resolveRequestId } from './resolve-request-id';
import {
  REQUEST_ID_HEADER,
  REQUEST_ID_RESPONSE_HEADER,
} from './request-id.constants';

const MAX_USER_AGENT_LENGTH = 512;

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

    const context: RequestContext = {
      requestId,
      correlationId,
      ipAddress: resolveClientIp(req),
      ...resolveUserAgentContext(req.headers['user-agent']),
    };

    this.requestContextStore.run(context, () => next());
  }
}

function resolveUserAgentContext(
  header: Request['headers']['user-agent'],
): Pick<RequestContext, 'userAgent'> | Record<string, never> {
  if (typeof header !== 'string') {
    return {};
  }

  const userAgent = header.trim();
  if (userAgent.length === 0) {
    return {};
  }

  return { userAgent: userAgent.slice(0, MAX_USER_AGENT_LENGTH) };
}
