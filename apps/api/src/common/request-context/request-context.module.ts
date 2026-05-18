import { Global, Module } from '@nestjs/common';
import { RequestContextStore } from './request-context.store';
import { RequestIdMiddleware } from './request-id.middleware';

@Global()
@Module({
  providers: [RequestContextStore, RequestIdMiddleware],
  exports: [RequestContextStore, RequestIdMiddleware],
})
export class RequestContextModule {}
