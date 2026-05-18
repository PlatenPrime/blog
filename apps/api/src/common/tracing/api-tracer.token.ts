import type { Tracer } from '@opentelemetry/api';

export const API_TRACER = Symbol('API_TRACER');

export type ApiTracer = Tracer;
