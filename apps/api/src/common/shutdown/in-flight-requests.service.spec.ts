import { describe, expect, it, vi } from 'vitest';
import { InFlightRequestsService } from './in-flight-requests.service';

describe('InFlightRequestsService', () => {
  it('tracks increment and decrement', () => {
    const service = new InFlightRequestsService();

    service.increment();
    service.increment();
    expect(service.inFlightCount).toBe(2);

    service.decrement();
    expect(service.inFlightCount).toBe(1);
  });

  it('does not decrement below zero', () => {
    const service = new InFlightRequestsService();

    service.decrement();
    expect(service.inFlightCount).toBe(0);
  });

  it('waitUntilDrained resolves immediately when count is zero', async () => {
    const service = new InFlightRequestsService();

    await expect(service.waitUntilDrained(100)).resolves.toBe(true);
  });

  it('waitUntilDrained resolves when requests finish within timeout', async () => {
    vi.useFakeTimers();
    const service = new InFlightRequestsService();
    service.increment();

    const drained = service.waitUntilDrained(500);

    setTimeout(() => {
      service.decrement();
    }, 100);

    await vi.advanceTimersByTimeAsync(150);

    await expect(drained).resolves.toBe(true);
    vi.useRealTimers();
  });

  it('waitUntilDrained returns false when timeout elapses', async () => {
    vi.useFakeTimers();
    const service = new InFlightRequestsService();
    service.increment();

    const drained = service.waitUntilDrained(100);

    await vi.advanceTimersByTimeAsync(150);

    await expect(drained).resolves.toBe(false);
    vi.useRealTimers();
  });
});
