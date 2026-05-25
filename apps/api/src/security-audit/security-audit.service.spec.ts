import { Logger } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Repository } from 'typeorm';
import { RequestContextStore } from '../common/request-context/request-context.store';
import type { SecurityAuditEvent } from './security-audit-event.entity';
import { SecurityAuditEventType } from './security-audit-event-type';
import { SecurityAuditService } from './security-audit.service';

describe('SecurityAuditService', () => {
  let service: SecurityAuditService;
  let create: ReturnType<typeof vi.fn>;
  let save: ReturnType<typeof vi.fn>;
  let getRequestId: ReturnType<typeof vi.fn>;
  let getCorrelationId: ReturnType<typeof vi.fn>;
  let getIpAddress: ReturnType<typeof vi.fn>;
  let getUserAgent: ReturnType<typeof vi.fn>;
  let eventsRepo: Repository<SecurityAuditEvent>;
  let requestContext: RequestContextStore;

  beforeEach(() => {
    create = vi.fn();
    save = vi.fn().mockResolvedValue({ id: 'audit-1' });
    getRequestId = vi.fn();
    getCorrelationId = vi.fn();
    getIpAddress = vi.fn();
    getUserAgent = vi.fn();
    eventsRepo = {
      create,
      save,
    } as unknown as Repository<SecurityAuditEvent>;
    requestContext = {
      getRequestId,
      getCorrelationId,
      getIpAddress,
      getUserAgent,
    } as unknown as RequestContextStore;
    service = new SecurityAuditService(eventsRepo, requestContext);
  });

  it('persists event with actor, subject, metadata, and request context', async () => {
    getRequestId.mockReturnValue('req-1');
    getCorrelationId.mockReturnValue('corr-1');
    getIpAddress.mockReturnValue('203.0.113.10');
    getUserAgent.mockReturnValue('Mozilla/5.0 test browser');
    const created = { id: 'audit-1' } as SecurityAuditEvent;
    create.mockReturnValue(created);

    await service.record({
      eventType: SecurityAuditEventType.AuthLoginSuccess,
      actorUserId: 'actor-1',
      subjectUserId: 'subject-1',
      metadata: { source: 'test' },
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: SecurityAuditEventType.AuthLoginSuccess,
        actorUserId: 'actor-1',
        subjectUserId: 'subject-1',
        requestId: 'req-1',
        correlationId: 'corr-1',
        ipAddress: '203.0.113.10',
        userAgent: 'Mozilla/5.0 test browser',
        metadata: { source: 'test' },
      }),
    );
    const createdArg = create.mock.calls[0]?.[0] as SecurityAuditEvent;
    expect(createdArg.occurredAt).toBeInstanceOf(Date);
    expect(save).toHaveBeenCalledWith(created);
  });

  it('uses null request ids when request context is empty', async () => {
    getRequestId.mockReturnValue(undefined);
    getCorrelationId.mockReturnValue(undefined);
    const created = { id: 'audit-2' } as SecurityAuditEvent;
    create.mockReturnValue(created);

    await service.record({
      eventType: SecurityAuditEventType.AuthLoginFailure,
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: null,
        correlationId: null,
        ipAddress: null,
        userAgent: null,
        actorUserId: null,
        subjectUserId: null,
        metadata: {},
      }),
    );
    expect(save).toHaveBeenCalledWith(created);
  });

  it('does not throw when save fails (fail-open)', async () => {
    create.mockReturnValue({ id: 'audit-3' });
    save.mockRejectedValue(new Error('db down'));
    const errorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    await expect(
      service.record({
        eventType: SecurityAuditEventType.AuthLogout,
      }),
    ).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
