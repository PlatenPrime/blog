import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MoreThan, type Repository } from 'typeorm';
import { hashPasswordResetToken } from './password-reset-token-hash';
import type { PasswordResetToken } from './password-reset-token.entity';
import { PasswordResetTokenService } from './password-reset-token.service';

describe('PasswordResetTokenService', () => {
  let service: PasswordResetTokenService;
  let findOne: ReturnType<typeof vi.fn>;
  let create: ReturnType<typeof vi.fn>;
  let save: ReturnType<typeof vi.fn>;
  let update: ReturnType<typeof vi.fn>;
  let passwordResetTokensRepo: Repository<PasswordResetToken>;

  beforeEach(() => {
    findOne = vi.fn();
    create = vi.fn();
    save = vi.fn();
    update = vi.fn();

    passwordResetTokensRepo = {
      findOne,
      create,
      save,
      update,
    } as unknown as Repository<PasswordResetToken>;

    service = new PasswordResetTokenService(passwordResetTokensRepo);
  });

  it('persistForUser hashes raw token and saves entity', async () => {
    const rawToken = 'opaque-password-reset-secret';
    const expiresAt = new Date('2030-01-01T00:00:00.000Z');
    const created = { id: 'prt-1' } as PasswordResetToken;
    create.mockReturnValue(created);
    save.mockResolvedValue(created);

    const result = await service.persistForUser({
      userId: 'user-1',
      rawToken,
      expiresAt,
    });

    expect(create).toHaveBeenCalledWith({
      userId: 'user-1',
      tokenHash: hashPasswordResetToken(rawToken),
      expiresAt,
      consumedAt: null,
    });
    expect(save).toHaveBeenCalledWith(created);
    expect(result).toBe(created);
  });

  it('findByRawToken looks up by hashed token', async () => {
    const rawToken = 'lookup-token';
    findOne.mockResolvedValue(null);

    await service.findByRawToken(rawToken);

    expect(findOne).toHaveBeenCalledWith({
      where: { tokenHash: hashPasswordResetToken(rawToken) },
    });
  });

  it('findActiveByRawToken filters consumed and expired tokens', async () => {
    const rawToken = 'active-token';
    findOne.mockResolvedValue(null);

    await service.findActiveByRawToken(rawToken);

    expect(findOne).toHaveBeenCalledOnce();
    const where = findOne.mock.calls[0]?.[0] as {
      where: {
        tokenHash: string;
        consumedAt: { type: string };
        expiresAt: ReturnType<typeof MoreThan>;
      };
    };
    expect(where.where.tokenHash).toBe(hashPasswordResetToken(rawToken));
    expect(where.where.consumedAt.type).toBe('isNull');
    expect(where.where.expiresAt.type).toBe('moreThan');
  });

  it('consume sets consumedAt for non-consumed row', async () => {
    update.mockResolvedValue({ affected: 1 });

    await service.consume('prt-1');

    expect(update).toHaveBeenCalledOnce();
    const criteria = update.mock.calls[0]?.[0] as {
      id: string;
      consumedAt: { type: string };
    };
    expect(criteria.id).toBe('prt-1');
    expect(criteria.consumedAt.type).toBe('isNull');
    const patch = update.mock.calls[0]?.[1] as { consumedAt: Date };
    expect(patch.consumedAt).toBeInstanceOf(Date);
  });

  it('invalidateActiveForUser marks active tokens consumed for user', async () => {
    update.mockResolvedValue({ affected: 2 });

    await service.invalidateActiveForUser('user-1');

    expect(update).toHaveBeenCalledOnce();
    const criteria = update.mock.calls[0]?.[0] as {
      userId: string;
      consumedAt: { type: string };
      expiresAt: ReturnType<typeof MoreThan>;
    };
    expect(criteria.userId).toBe('user-1');
    expect(criteria.consumedAt.type).toBe('isNull');
    expect(criteria.expiresAt.type).toBe('moreThan');
    const patch = update.mock.calls[0]?.[1] as { consumedAt: Date };
    expect(patch.consumedAt).toBeInstanceOf(Date);
  });
});
