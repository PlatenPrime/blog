import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Repository, SelectQueryBuilder } from 'typeorm';
import { PermissionKey } from './permission-key';
import { UserRole } from './user-role.entity';
import { UserPermissionsService } from './user-permissions.service';

describe('UserPermissionsService', () => {
  let getRawMany: ReturnType<typeof vi.fn>;
  let select: ReturnType<typeof vi.fn>;
  let where: ReturnType<typeof vi.fn>;
  let innerJoin: ReturnType<typeof vi.fn>;
  let createQueryBuilder: ReturnType<typeof vi.fn>;
  let userRoles: Repository<UserRole>;
  let service: UserPermissionsService;

  beforeEach(() => {
    getRawMany = vi.fn();
    select = vi.fn().mockReturnThis();
    where = vi.fn().mockReturnThis();
    innerJoin = vi.fn().mockReturnThis();

    const qb = {
      innerJoin,
      where,
      select,
      getRawMany,
    } as unknown as SelectQueryBuilder<UserRole>;

    createQueryBuilder = vi.fn().mockReturnValue(qb);
    userRoles = {
      createQueryBuilder,
    } as unknown as Repository<UserRole>;
    service = new UserPermissionsService(userRoles);
  });

  it('returns distinct known permission keys for user', async () => {
    getRawMany.mockResolvedValue([
      { key: PermissionKey.PostsWrite },
      { key: PermissionKey.PostsRead },
      { key: 'unknown:perm' },
    ]);

    const keys = await service.findPermissionKeysByUserId(
      '11111111-1111-4111-8111-111111111111',
    );

    expect(keys).toEqual([PermissionKey.PostsWrite, PermissionKey.PostsRead]);
    expect(createQueryBuilder).toHaveBeenCalledWith('ur');
    expect(where).toHaveBeenCalledWith('ur.user_id = :userId', {
      userId: '11111111-1111-4111-8111-111111111111',
    });
  });

  it('returns empty array when user has no permissions', async () => {
    getRawMany.mockResolvedValue([]);

    await expect(
      service.findPermissionKeysByUserId(
        '22222222-2222-4222-8222-222222222222',
      ),
    ).resolves.toEqual([]);
  });
});
