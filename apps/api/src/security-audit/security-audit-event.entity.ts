import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import type { SecurityAuditEventType } from './security-audit-event-type';

@Entity({ name: 'security_audit_events' })
export class SecurityAuditEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'event_type', type: 'varchar', length: 64 })
  eventType!: SecurityAuditEventType;

  @Column({ name: 'actor_user_id', type: 'uuid', nullable: true })
  actorUserId!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actor_user_id' })
  actor!: User | null;

  @Column({ name: 'subject_user_id', type: 'uuid', nullable: true })
  subjectUserId!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'subject_user_id' })
  subject!: User | null;

  @Column({ name: 'request_id', type: 'varchar', length: 64, nullable: true })
  requestId!: string | null;

  @Column({
    name: 'correlation_id',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  correlationId!: string | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 512, nullable: true })
  userAgent!: string | null;

  @Column({ name: 'metadata', type: 'jsonb', default: () => "'{}'" })
  metadata!: Record<string, unknown>;

  @Column({
    name: 'occurred_at',
    type: 'timestamptz',
    default: () => 'now()',
  })
  occurredAt!: Date;
}
