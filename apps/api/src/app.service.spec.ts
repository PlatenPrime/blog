import { SHARED_CONTRACTS_VERSION } from '@blog/shared-contracts';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(() => {
    service = new AppService();
  });

  describe('getHello', () => {
    it('returns the standard greeting interpolated with the shared-contracts version', () => {
      expect(service.getHello()).toBe(
        `Hello World! (${SHARED_CONTRACTS_VERSION})`,
      );
    });

    it('uses SHARED_CONTRACTS_VERSION from @blog/shared-contracts (pins the import contract)', () => {
      const match = service.getHello().match(/\(([^)]+)\)$/);

      expect(match?.[1]).toBe(SHARED_CONTRACTS_VERSION);
    });
  });
});
