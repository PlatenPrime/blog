import { describe, expect, it, vi } from 'vitest';
import { configureApiShutdown } from './configure-api-shutdown';

describe('configureApiShutdown', () => {
  it('enables Nest shutdown hooks on the application', () => {
    const app = {
      enableShutdownHooks: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
    };

    configureApiShutdown(app as never);

    expect(app.enableShutdownHooks).toHaveBeenCalledTimes(1);
  });
});
