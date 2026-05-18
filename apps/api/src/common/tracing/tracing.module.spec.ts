import { Test } from '@nestjs/testing';
import type { Tracer } from '@opentelemetry/api';
import { describe, expect, it } from 'vitest';
import { API_TRACER } from './api-tracer.token';
import { TracingModule } from './tracing.module';

describe('TracingModule', () => {
  it('provides API_TRACER from the global tracer', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TracingModule],
    }).compile();

    const tracer = moduleRef.get<Tracer>(API_TRACER);

    expect(tracer).toBeDefined();
    expect(typeof tracer.startSpan).toBe('function');
  });
});
