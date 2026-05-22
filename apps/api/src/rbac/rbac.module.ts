import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Permission } from './permission.entity';
import { RbacProbeController } from './rbac-probe.controller';
import { RolePermission } from './role-permission.entity';
import { Role } from './role.entity';
import { RolesGuard } from './roles.guard';
import { UserRole } from './user-role.entity';
import { UserRolesService } from './user-roles.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Role, Permission, RolePermission, UserRole]),
  ],
  controllers: [RbacProbeController],
  providers: [UserRolesService, RolesGuard],
  exports: [TypeOrmModule, UserRolesService, RolesGuard],
})
export class RbacModule {}
