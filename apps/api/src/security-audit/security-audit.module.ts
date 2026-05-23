import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestContextModule } from '../common/request-context/request-context.module';
import { SecurityAuditEvent } from './security-audit-event.entity';
import { SecurityAuditService } from './security-audit.service';

@Module({
  imports: [
    RequestContextModule,
    TypeOrmModule.forFeature([SecurityAuditEvent]),
  ],
  providers: [SecurityAuditService],
  exports: [SecurityAuditService, TypeOrmModule],
})
export class SecurityAuditModule {}
