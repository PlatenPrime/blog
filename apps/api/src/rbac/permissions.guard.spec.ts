import {
  ExecutionContext,
  ForbiddenException,
  type Type,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PermissionKey } from './permission-key';
import { INSUFFICIENT_PERMISSION_MESSAGE } from './permissions-guard.constants';
import { PERMISSIONS_KEY } from './permissions-metadata.constants';
import { PermissionsGuard } from './permissions.guard';
import { UserPermissionsService } from './user-permissions.service';

function createExecutionContext(
  user: { sub: string } | undefined,
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}) as Type<unknown>,
  } as ExecutionContext;
}

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let getAllAndOverride: ReturnType<typeof vi.fn>;
  let findPermissionKeysByUserId: ReturnType<typeof vi.fn>;
  let reflector: Reflector;
  let userPermissions: UserPermissionsService;

  beforeEach(() => {
    getAllAndOverride = vi.fn();
    findPermissionKeysByUserId = vi.fn();
    reflector = {
      getAllAndOverride,
    } as unknown as Reflector;
    userPermissions = {
      findPermissionKeysByUserId,
    } as unknown as UserPermissionsService;
    guard = new PermissionsGuard(reflector, userPermissions);
  });

  it('allows when no @Permissions metadata is present', async () => {
    getAllAndOverride.mockReturnValue(undefined);

    await expect(
      guard.canActivate(
        createExecutionContext({ sub: '11111111-1111-4111-8111-111111111111' }),
      ),
    ).resolves.toBe(true);

    expect(findPermissionKeysByUserId).not.toHaveBeenCalled();
  });

  it('allows when required permissions metadata is empty', async () => {
    getAllAndOverride.mockReturnValue([]);

    await expect(
      guard.canActivate(
        createExecutionContext({ sub: '11111111-1111-4111-8111-111111111111' }),
      ),
    ).resolves.toBe(true);

    expect(findPermissionKeysByUserId).not.toHaveBeenCalled();
  });

  it('returns false when authenticated user is missing', async () => {
    getAllAndOverride.mockReturnValue([PermissionKey.PostsWrite]);

    await expect(
      guard.canActivate(createExecutionContext(undefined)),
    ).resolves.toBe(false);

    expect(findPermissionKeysByUserId).not.toHaveBeenCalled();
  });

  it('allows when user has at least one required permission (OR)', async () => {
    getAllAndOverride.mockReturnValue([
      PermissionKey.PostsWrite,
      PermissionKey.PostsRead,
    ]);
    findPermissionKeysByUserId.mockResolvedValue([PermissionKey.PostsRead]);

    await expect(
      guard.canActivate(
        createExecutionContext({ sub: '11111111-1111-4111-8111-111111111111' }),
      ),
    ).resolves.toBe(true);

    expect(getAllAndOverride).toHaveBeenCalledWith(
      PERMISSIONS_KEY,
      expect.any(Array),
    );
    expect(findPermissionKeysByUserId).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
    );
  });

  it('throws ForbiddenException when user lacks all required permissions', async () => {
    getAllAndOverride.mockReturnValue([PermissionKey.PostsWrite]);
    findPermissionKeysByUserId.mockResolvedValue([PermissionKey.PostsRead]);

    await expect(
      guard.canActivate(
        createExecutionContext({ sub: '11111111-1111-4111-8111-111111111111' }),
      ),
    ).rejects.toThrow(new ForbiddenException(INSUFFICIENT_PERMISSION_MESSAGE));
  });
});
