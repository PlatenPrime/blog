import {
  ExecutionContext,
  ForbiddenException,
  type Type,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '../users/user.entity';
import { EMAIL_NOT_VERIFIED_MESSAGE } from './email-verified-policy.constants';
import { EmailVerifiedPolicyService } from './email-verified-policy.service';
import { EmailVerifiedGuard } from './email-verified.guard';
import { UserService } from '../users/user.service';

function createExecutionContext(
  user: { sub: string } | undefined,
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}) as Type<unknown>,
  } as ExecutionContext;
}

const userId = '11111111-1111-4111-8111-111111111111';

const unverifiedUser: User = {
  id: userId,
  email: 'user@example.com',
  passwordHash: 'hash',
  emailVerifiedAt: null,
  createdAt: new Date('2026-05-20T10:00:00.000Z'),
  updatedAt: new Date('2026-05-20T10:00:00.000Z'),
};

describe('EmailVerifiedGuard', () => {
  let guard: EmailVerifiedGuard;
  let isRequired: ReturnType<typeof vi.fn>;
  let assertUserMayAuthenticate: ReturnType<typeof vi.fn>;
  let findById: ReturnType<typeof vi.fn>;
  let emailVerifiedPolicy: EmailVerifiedPolicyService;
  let users: UserService;

  beforeEach(() => {
    isRequired = vi.fn().mockReturnValue(false);
    assertUserMayAuthenticate = vi.fn();
    findById = vi.fn();
    emailVerifiedPolicy = {
      isRequired,
      assertUserMayAuthenticate,
    } as unknown as EmailVerifiedPolicyService;
    users = { findById } as unknown as UserService;
    guard = new EmailVerifiedGuard(emailVerifiedPolicy, users);
  });

  it('allows when policy is off without loading user', async () => {
    await expect(
      guard.canActivate(createExecutionContext({ sub: userId })),
    ).resolves.toBe(true);

    expect(findById).not.toHaveBeenCalled();
  });

  it('returns false when authenticated user is missing and policy is on', async () => {
    isRequired.mockReturnValue(true);

    await expect(
      guard.canActivate(createExecutionContext(undefined)),
    ).resolves.toBe(false);

    expect(findById).not.toHaveBeenCalled();
  });

  it('allows verified user when policy is on', async () => {
    isRequired.mockReturnValue(true);
    findById.mockResolvedValue({
      ...unverifiedUser,
      emailVerifiedAt: new Date('2026-05-21T00:00:00.000Z'),
    });

    await expect(
      guard.canActivate(createExecutionContext({ sub: userId })),
    ).resolves.toBe(true);

    expect(assertUserMayAuthenticate).toHaveBeenCalled();
  });

  it('throws ForbiddenException when policy is on and user is unverified', async () => {
    isRequired.mockReturnValue(true);
    findById.mockResolvedValue(unverifiedUser);
    assertUserMayAuthenticate.mockImplementation(() => {
      throw new ForbiddenException(EMAIL_NOT_VERIFIED_MESSAGE);
    });

    await expect(
      guard.canActivate(createExecutionContext({ sub: userId })),
    ).rejects.toThrow(new ForbiddenException(EMAIL_NOT_VERIFIED_MESSAGE));
  });

  it('throws ForbiddenException when user row is missing', async () => {
    isRequired.mockReturnValue(true);
    findById.mockResolvedValue(null);

    await expect(
      guard.canActivate(createExecutionContext({ sub: userId })),
    ).rejects.toThrow(new ForbiddenException(EMAIL_NOT_VERIFIED_MESSAGE));
  });
});
