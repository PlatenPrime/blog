import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Permission } from './permission.entity';
import { RbacProbeController } from './rbac-probe.controller';
import { RolePermission } from './role-permission.entity';
import { Role } from './role.entity';
import { PermissionsGuard } from './permissions.guard';
import { RolesGuard } from './roles.guard';
import { UserRole } from './user-role.entity';
import { UserPermissionsService } from './user-permissions.service';
import { UserRolesService } from './user-roles.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Role, Permission, RolePermission, UserRole]),
  ],
  controllers: [RbacProbeController],
  providers: [
    UserRolesService,
    RolesGuard,
    UserPermissionsService,
    PermissionsGuard,
  ],
  exports: [
    TypeOrmModule,
    UserRolesService,
    RolesGuard,
    UserPermissionsService,
    PermissionsGuard,
  ],
})
export class RbacModule {}
