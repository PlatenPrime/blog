import { Global, Module } from '@nestjs/common';
import { trace } from '@opentelemetry/api';
import { API_TRACER } from './api-tracer.token';
import { OTEL_TRACER_NAME } from './tracing.constants';

@Global()
@Module({
  providers: [
    {
      provide: API_TRACER,
      useFactory: () => trace.getTracer(OTEL_TRACER_NAME),
    },
  ],
  exports: [API_TRACER],
})
export class TracingModule {}
