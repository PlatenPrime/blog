import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Repository } from 'typeorm';
import { DEFAULT_PERMISSION_RECORDS } from './default-permission-records';
import { PermissionKey } from './permission-key';
import type { Permission } from './permission.entity';
import { DEFAULT_ROLE_PERMISSION_RECORDS } from './default-role-permission-records';
import { RoleSlug } from './role-slug';
import type { Role } from './role.entity';
import type { RolePermission } from './role-permission.entity';
import { seedDefaultPermissions } from './seed-default-permissions';
import { seedDefaultRolePermissions } from './seed-default-role-permissions';

describe('DEFAULT_PERMISSION_RECORDS', () => {
  it('covers all default permission keys', () => {
    expect(DEFAULT_PERMISSION_RECORDS).toHaveLength(2);
    expect(DEFAULT_PERMISSION_RECORDS.map((r) => r.key)).toEqual([
      PermissionKey.PostsRead,
      PermissionKey.PostsWrite,
    ]);
  });
});

describe('DEFAULT_ROLE_PERMISSION_RECORDS', () => {
  it('maps viewer to read-only and admin/editor to read+write', () => {
    const viewer = DEFAULT_ROLE_PERMISSION_RECORDS.find(
      (r) => r.roleSlug === RoleSlug.Viewer,
    );
    const editor = DEFAULT_ROLE_PERMISSION_RECORDS.find(
      (r) => r.roleSlug === RoleSlug.Editor,
    );

    expect(viewer?.permissionKeys).toEqual([PermissionKey.PostsRead]);
    expect(editor?.permissionKeys).toEqual([
      PermissionKey.PostsRead,
      PermissionKey.PostsWrite,
    ]);
  });
});

describe('seedDefaultPermissions', () => {
  let findOne: ReturnType<typeof vi.fn>;
  let create: ReturnType<typeof vi.fn>;
  let save: ReturnType<typeof vi.fn>;
  let permissionsRepo: Repository<Permission>;

  beforeEach(() => {
    findOne = vi.fn();
    create = vi.fn((input: Partial<Permission>) => input);
    save = vi.fn((entity: Permission) => Promise.resolve(entity));

    permissionsRepo = {
      findOne,
      create,
      save,
    } as unknown as Repository<Permission>;
  });

  it('inserts all permissions when table is empty', async () => {
    findOne.mockResolvedValue(null);

    const result = await seedDefaultPermissions(permissionsRepo);

    expect(result).toEqual({ inserted: 2, skipped: 0 });
    expect(save).toHaveBeenCalledTimes(2);
  });

  it('skips all permissions when every key already exists', async () => {
    findOne.mockResolvedValue({ id: 'existing', key: PermissionKey.PostsRead });

    const result = await seedDefaultPermissions(permissionsRepo);

    expect(result).toEqual({ inserted: 0, skipped: 2 });
    expect(save).not.toHaveBeenCalled();
  });
});

describe('seedDefaultRolePermissions', () => {
  let rolesFindOne: ReturnType<typeof vi.fn>;
  let permissionsFindOne: ReturnType<typeof vi.fn>;
  let rolePermissionsFindOne: ReturnType<typeof vi.fn>;
  let rolePermissionsCreate: ReturnType<typeof vi.fn>;
  let rolePermissionsSave: ReturnType<typeof vi.fn>;
  let rolesRepo: Repository<Role>;
  let permissionsRepo: Repository<Permission>;
  let rolePermissionsRepo: Repository<RolePermission>;

  const adminRole: Role = {
    id: 'role-admin-id',
    slug: RoleSlug.Admin,
    name: 'Administrator',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const postsRead: Permission = {
    id: 'perm-read-id',
    key: PermissionKey.PostsRead,
    description: 'read',
    createdAt: new Date(),
  };

  beforeEach(() => {
    rolesFindOne = vi.fn();
    permissionsFindOne = vi.fn();
    rolePermissionsFindOne = vi.fn();
    rolePermissionsCreate = vi.fn((input: Partial<RolePermission>) => input);
    rolePermissionsSave = vi.fn((entity: RolePermission) =>
      Promise.resolve(entity),
    );

    rolesRepo = { findOne: rolesFindOne } as unknown as Repository<Role>;
    permissionsRepo = {
      findOne: permissionsFindOne,
    } as unknown as Repository<Permission>;
    rolePermissionsRepo = {
      findOne: rolePermissionsFindOne,
      create: rolePermissionsCreate,
      save: rolePermissionsSave,
    } as unknown as Repository<RolePermission>;
  });

  it('skips existing role-permission links', async () => {
    rolesFindOne.mockResolvedValue(adminRole);
    permissionsFindOne.mockResolvedValue(postsRead);
    rolePermissionsFindOne.mockResolvedValue(
      rolePermissionsRepo.create({
        roleId: adminRole.id,
        permissionId: postsRead.id,
      }),
    );

    const result = await seedDefaultRolePermissions(
      rolesRepo,
      permissionsRepo,
      rolePermissionsRepo,
    );

    expect(result.inserted).toBe(0);
    expect(result.skipped).toBeGreaterThan(0);
    expect(rolePermissionsSave).not.toHaveBeenCalled();
  });

  it('throws when role slug is missing', async () => {
    rolesFindOne.mockResolvedValue(null);

    await expect(
      seedDefaultRolePermissions(
        rolesRepo,
        permissionsRepo,
        rolePermissionsRepo,
      ),
    ).rejects.toThrow(/run db:seed:roles first/);
  });
});
