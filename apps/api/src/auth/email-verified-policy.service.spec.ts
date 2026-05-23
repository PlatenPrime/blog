import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '../users/user.entity';
import { EMAIL_NOT_VERIFIED_MESSAGE } from './email-verified-policy.constants';
import { EmailVerifiedPolicyService } from './email-verified-policy.service';

const baseUser: User = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'user@example.com',
  passwordHash: 'hash',
  emailVerifiedAt: null,
  createdAt: new Date('2026-05-20T10:00:00.000Z'),
  updatedAt: new Date('2026-05-20T10:00:00.000Z'),
};

describe('EmailVerifiedPolicyService', () => {
  let configGet: ReturnType<typeof vi.fn>;
  let service: EmailVerifiedPolicyService;

  beforeEach(() => {
    configGet = vi.fn().mockReturnValue(false);
    const config = { get: configGet } as unknown as ConfigService;
    service = new EmailVerifiedPolicyService(config);
  });

  it('isRequired returns false when env is off', () => {
    expect(service.isRequired()).toBe(false);
  });

  it('isRequired returns true when env is on', () => {
    configGet.mockReturnValue(true);
    expect(service.isRequired()).toBe(true);
  });

  it('assertUserMayAuthenticate is a no-op when policy is off', () => {
    expect(() => service.assertUserMayAuthenticate(baseUser)).not.toThrow();
  });

  it('assertUserMayAuthenticate is a no-op when email is verified', () => {
    configGet.mockReturnValue(true);
    expect(() =>
      service.assertUserMayAuthenticate({
        ...baseUser,
        emailVerifiedAt: new Date('2026-05-21T00:00:00.000Z'),
      }),
    ).not.toThrow();
  });

  it('assertUserMayAuthenticate throws ForbiddenException when policy on and unverified', () => {
    configGet.mockReturnValue(true);
    expect(() => service.assertUserMayAuthenticate(baseUser)).toThrow(
      ForbiddenException,
    );
    expect(() => service.assertUserMayAuthenticate(baseUser)).toThrow(
      EMAIL_NOT_VERIFIED_MESSAGE,
    );
  });
});
