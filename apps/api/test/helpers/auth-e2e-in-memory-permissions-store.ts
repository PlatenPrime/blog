import type { PermissionKey } from '../../src/rbac/permission-key';

/** In-memory UserPermissionsService shape for auth flow e2e (RBAC lookup by registered user id). */
export type InMemoryUserPermissionsServiceOverride = {
  findPermissionKeysByUserId: (userId: string) => Promise<PermissionKey[]>;
  setPermissionKeysForUser: (
    userId: string,
    keys: readonly PermissionKey[],
  ) => void;
};

export function createInMemoryUserPermissionsServiceOverride(): InMemoryUserPermissionsServiceOverride {
  const keysByUserId = new Map<string, PermissionKey[]>();

  return {
    findPermissionKeysByUserId(userId: string): Promise<PermissionKey[]> {
      return Promise.resolve(keysByUserId.get(userId) ?? []);
    },

    setPermissionKeysForUser(
      userId: string,
      keys: readonly PermissionKey[],
    ): void {
      keysByUserId.set(userId, [...keys]);
    },
  };
}
