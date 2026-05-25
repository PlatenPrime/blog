import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestContextStore } from '../common/request-context/request-context.store';
import { SecurityAuditEvent } from './security-audit-event.entity';
import type { SecurityAuditEventType } from './security-audit-event-type';

export type RecordSecurityAuditInput = {
  readonly eventType: SecurityAuditEventType;
  readonly actorUserId?: string | null;
  readonly subjectUserId?: string | null;
  readonly metadata?: Record<string, unknown>;
};

@Injectable()
export class SecurityAuditService {
  private readonly logger = new Logger(SecurityAuditService.name);

  constructor(
    @InjectRepository(SecurityAuditEvent)
    private readonly events: Repository<SecurityAuditEvent>,
    private readonly requestContext: RequestContextStore,
  ) {}

  async record(input: RecordSecurityAuditInput): Promise<void> {
    try {
      const event = this.events.create({
        eventType: input.eventType,
        actorUserId: input.actorUserId ?? null,
        subjectUserId: input.subjectUserId ?? null,
        requestId: this.requestContext.getRequestId() ?? null,
        correlationId: this.requestContext.getCorrelationId() ?? null,
        ipAddress: this.requestContext.getIpAddress() ?? null,
        userAgent: this.requestContext.getUserAgent() ?? null,
        metadata: input.metadata ?? {},
        occurredAt: new Date(),
      });

      await this.events.save(event);
    } catch (error) {
      this.logger.error(
        `Failed to persist security audit event ${input.eventType}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
