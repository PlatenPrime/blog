import { describe, expect, it, vi } from 'vitest';
import { configureApiShutdown } from './configure-api-shutdown';

describe('configureApiShutdown', () => {
  it('enables Nest shutdown hooks without default signal bindings and binds coordinator', () => {
    const coordinator = {
      bindApplication: vi.fn(),
    };
    const app = {
      enableShutdownHooks: vi.fn(),
      get: vi.fn().mockReturnValue(coordinator),
    };

    configureApiShutdown(app as never);

    expect(app.enableShutdownHooks).toHaveBeenCalledWith([]);
    expect(app.get).toHaveBeenCalledTimes(1);
    expect(coordinator.bindApplication).toHaveBeenCalledWith(app);
  });
});
