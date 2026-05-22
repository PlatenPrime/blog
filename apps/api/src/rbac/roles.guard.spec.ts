import {
  ExecutionContext,
  ForbiddenException,
  type Type,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RoleSlug } from './role-slug';
import { INSUFFICIENT_ROLE_MESSAGE } from './roles-guard.constants';
import { ROLES_KEY } from './roles-metadata.constants';
import { RolesGuard } from './roles.guard';
import { UserRolesService } from './user-roles.service';

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

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let getAllAndOverride: ReturnType<typeof vi.fn>;
  let findRoleSlugsByUserId: ReturnType<typeof vi.fn>;
  let reflector: Reflector;
  let userRoles: UserRolesService;

  beforeEach(() => {
    getAllAndOverride = vi.fn();
    findRoleSlugsByUserId = vi.fn();
    reflector = {
      getAllAndOverride,
    } as unknown as Reflector;
    userRoles = {
      findRoleSlugsByUserId,
    } as unknown as UserRolesService;
    guard = new RolesGuard(reflector, userRoles);
  });

  it('allows when no @Roles metadata is present', async () => {
    getAllAndOverride.mockReturnValue(undefined);

    await expect(
      guard.canActivate(
        createExecutionContext({ sub: '11111111-1111-4111-8111-111111111111' }),
      ),
    ).resolves.toBe(true);

    expect(findRoleSlugsByUserId).not.toHaveBeenCalled();
  });

  it('allows when required roles metadata is empty', async () => {
    getAllAndOverride.mockReturnValue([]);

    await expect(
      guard.canActivate(
        createExecutionContext({ sub: '11111111-1111-4111-8111-111111111111' }),
      ),
    ).resolves.toBe(true);

    expect(findRoleSlugsByUserId).not.toHaveBeenCalled();
  });

  it('returns false when authenticated user is missing', async () => {
    getAllAndOverride.mockReturnValue([RoleSlug.Admin]);

    await expect(
      guard.canActivate(createExecutionContext(undefined)),
    ).resolves.toBe(false);

    expect(findRoleSlugsByUserId).not.toHaveBeenCalled();
  });

  it('allows when user has at least one required role (OR)', async () => {
    getAllAndOverride.mockReturnValue([RoleSlug.Admin, RoleSlug.Editor]);
    findRoleSlugsByUserId.mockResolvedValue([RoleSlug.Viewer, RoleSlug.Editor]);

    await expect(
      guard.canActivate(
        createExecutionContext({ sub: '11111111-1111-4111-8111-111111111111' }),
      ),
    ).resolves.toBe(true);

    expect(getAllAndOverride).toHaveBeenCalledWith(
      ROLES_KEY,
      expect.any(Array),
    );
    expect(findRoleSlugsByUserId).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
    );
  });

  it('throws ForbiddenException when user lacks all required roles', async () => {
    getAllAndOverride.mockReturnValue([RoleSlug.Admin]);
    findRoleSlugsByUserId.mockResolvedValue([RoleSlug.Viewer]);

    await expect(
      guard.canActivate(
        createExecutionContext({ sub: '11111111-1111-4111-8111-111111111111' }),
      ),
    ).rejects.toThrow(new ForbiddenException(INSUFFICIENT_ROLE_MESSAGE));
  });
});
