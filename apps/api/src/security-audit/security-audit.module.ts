import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecurityAuditEvent } from './security-audit-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SecurityAuditEvent])],
  exports: [TypeOrmModule],
})
export class SecurityAuditModule {}
