import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';
import type { RequestContext } from './request-context.types';

@Injectable()
export class RequestContextStore {
  private readonly storage = new AsyncLocalStorage<RequestContext>();

  run<T>(context: RequestContext, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  getRequestId(): string | undefined {
    return this.storage.getStore()?.requestId;
  }

  getCorrelationId(): string | undefined {
    return this.storage.getStore()?.correlationId;
  }
}
