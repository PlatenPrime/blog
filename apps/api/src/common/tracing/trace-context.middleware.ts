import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { context, propagation, SpanKind, trace } from '@opentelemetry/api';
import type { NextFunction, Request, Response } from 'express';
import { API_TRACER, type ApiTracer } from './api-tracer.token';

@Injectable()
export class TraceContextMiddleware implements NestMiddleware {
  constructor(@Inject(API_TRACER) private readonly tracer: ApiTracer) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const extractedContext = propagation.extract(context.active(), req.headers);

    const span = this.tracer.startSpan(
      `HTTP ${req.method}`,
      {
        kind: SpanKind.SERVER,
        attributes: {
          'http.method': req.method,
          'http.route': req.path,
        },
      },
      extractedContext,
    );

    const activeContext = trace.setSpan(extractedContext, span);

    res.once('finish', () => {
      span.setAttribute('http.status_code', res.statusCode);
      span.end();
    });

    context.with(activeContext, () => next());
  }
}
