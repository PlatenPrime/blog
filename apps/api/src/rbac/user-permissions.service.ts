import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './permission.entity';
import { DEFAULT_PERMISSION_KEYS, type PermissionKey } from './permission-key';
import { RolePermission } from './role-permission.entity';
import { UserRole } from './user-role.entity';

const DEFAULT_PERMISSION_KEY_SET = new Set<string>(DEFAULT_PERMISSION_KEYS);

function isPermissionKey(key: string): key is PermissionKey {
  return DEFAULT_PERMISSION_KEY_SET.has(key);
}

@Injectable()
export class UserPermissionsService {
  constructor(
    @InjectRepository(UserRole)
    private readonly userRoles: Repository<UserRole>,
  ) {}

  async findPermissionKeysByUserId(userId: string): Promise<PermissionKey[]> {
    const rows = await this.userRoles
      .createQueryBuilder('ur')
      .innerJoin('ur.role', 'role')
      .innerJoin(RolePermission, 'rp', 'rp.role_id = role.id')
      .innerJoin(Permission, 'p', 'p.id = rp.permission_id')
      .where('ur.user_id = :userId', { userId })
      .select('DISTINCT p.key', 'key')
      .getRawMany<{ key: string }>();

    const keys: PermissionKey[] = [];
    for (const row of rows) {
      if (isPermissionKey(row.key)) {
        keys.push(row.key);
      }
    }
    return keys;
  }
}
