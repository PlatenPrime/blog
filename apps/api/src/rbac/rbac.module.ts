import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './permission.entity';
import { RolePermission } from './role-permission.entity';
import { Role } from './role.entity';
import { UserRole } from './user-role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, Permission, RolePermission, UserRole]),
  ],
  exports: [TypeOrmModule],
})
export class RbacModule {}
