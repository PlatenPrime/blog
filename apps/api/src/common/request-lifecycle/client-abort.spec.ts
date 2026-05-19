import { EventEmitter } from 'node:events';
import type { Request, Response } from 'express';
import { firstValueFrom, race, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { describe, expect, it } from 'vitest';
import { clientAbort$ } from './client-abort';

function createMockRequest(): Request {
  return new EventEmitter() as unknown as Request;
}

describe('clientAbort$', () => {
  it('emits when the client closes before the response is finished', async () => {
    const request = createMockRequest();
    const response = { writableEnded: false } as Response;

    const result = firstValueFrom(clientAbort$(request, response));

    (request as EventEmitter).emit('close');
    await expect(result).resolves.toBeUndefined();
  });

  it('does not emit when the response has already finished', async () => {
    const request = createMockRequest();
    const response = { writableEnded: true } as Response;

    const outcome = await firstValueFrom(
      race(
        clientAbort$(request, response).pipe(map(() => 'abort' as const)),
        timer(50).pipe(map(() => 'timeout' as const)),
      ),
    );

    (request as EventEmitter).emit('close');
    expect(outcome).toBe('timeout');
  });
});
