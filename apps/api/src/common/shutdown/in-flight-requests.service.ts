import { Injectable } from '@nestjs/common';

const DRAIN_POLL_MS = 25;

@Injectable()
export class InFlightRequestsService {
  private count = 0;

  get inFlightCount(): number {
    return this.count;
  }

  increment(): void {
    this.count += 1;
  }

  decrement(): void {
    if (this.count > 0) {
      this.count -= 1;
    }
  }

  /**
   * Resolves when {@link count} reaches zero or {@link timeoutMs} elapses.
   * @returns `true` if drained, `false` if timed out with requests still active.
   */
  waitUntilDrained(timeoutMs: number): Promise<boolean> {
    if (this.count === 0) {
      return Promise.resolve(true);
    }

    const deadline = Date.now() + timeoutMs;

    return new Promise((resolve) => {
      const tick = () => {
        if (this.count === 0) {
          resolve(true);
          return;
        }

        if (Date.now() >= deadline) {
          resolve(false);
          return;
        }

        setTimeout(tick, DRAIN_POLL_MS);
      };

      tick();
    });
  }
}
