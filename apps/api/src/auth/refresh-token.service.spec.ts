import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MoreThan, type Repository } from 'typeorm';
import { hashRefreshToken } from './refresh-token-hash';
import type { RefreshToken } from './refresh-token.entity';
import { RefreshTokenService } from './refresh-token.service';

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;
  let findOne: ReturnType<typeof vi.fn>;
  let create: ReturnType<typeof vi.fn>;
  let save: ReturnType<typeof vi.fn>;
  let update: ReturnType<typeof vi.fn>;
  let refreshTokensRepo: Repository<RefreshToken>;

  beforeEach(() => {
    findOne = vi.fn();
    create = vi.fn();
    save = vi.fn();
    update = vi.fn();

    refreshTokensRepo = {
      findOne,
      create,
      save,
      update,
    } as unknown as Repository<RefreshToken>;

    service = new RefreshTokenService(refreshTokensRepo);
  });

  it('persistForUser hashes raw token and saves entity', async () => {
    const rawToken = 'opaque-refresh-secret';
    const expiresAt = new Date('2030-01-01T00:00:00.000Z');
    const created = { id: 'rt-1' } as RefreshToken;
    create.mockReturnValue(created);
    save.mockResolvedValue(created);

    const result = await service.persistForUser({
      userId: 'user-1',
      rawToken,
      expiresAt,
    });

    expect(create).toHaveBeenCalledWith({
      userId: 'user-1',
      tokenHash: hashRefreshToken(rawToken),
      expiresAt,
      revokedAt: null,
      replacedByTokenId: null,
    });
    expect(save).toHaveBeenCalledWith(created);
    expect(result).toBe(created);
  });

  it('findByRawToken looks up by hashed token', async () => {
    const rawToken = 'lookup-token';
    findOne.mockResolvedValue(null);

    await service.findByRawToken(rawToken);

    expect(findOne).toHaveBeenCalledWith({
      where: { tokenHash: hashRefreshToken(rawToken) },
    });
  });

  it('findActiveByRawToken filters revoked and expired tokens', async () => {
    const rawToken = 'active-token';
    findOne.mockResolvedValue(null);

    await service.findActiveByRawToken(rawToken);

    expect(findOne).toHaveBeenCalledOnce();
    const where = findOne.mock.calls[0]?.[0] as {
      where: {
        tokenHash: string;
        revokedAt: { type: string };
        expiresAt: ReturnType<typeof MoreThan>;
      };
    };
    expect(where.where.tokenHash).toBe(hashRefreshToken(rawToken));
    expect(where.where.revokedAt.type).toBe('isNull');
    expect(where.where.expiresAt.type).toBe('moreThan');
  });

  it('revokeAllActiveForUser revokes all non-revoked tokens for user', async () => {
    update.mockResolvedValue({ affected: 3 });

    await service.revokeAllActiveForUser('user-1');

    expect(update).toHaveBeenCalledOnce();
    const criteria = update.mock.calls[0]?.[0] as {
      userId: string;
      revokedAt: { type: string };
    };
    expect(criteria.userId).toBe('user-1');
    expect(criteria.revokedAt.type).toBe('isNull');
    const patch = update.mock.calls[0]?.[1] as { revokedAt: Date };
    expect(patch.revokedAt).toBeInstanceOf(Date);
  });

  it('revoke sets revokedAt for non-revoked row', async () => {
    update.mockResolvedValue({ affected: 1 });

    await service.revoke('rt-1');

    expect(update).toHaveBeenCalledOnce();
    const criteria = update.mock.calls[0]?.[0] as {
      id: string;
      revokedAt: { type: string };
    };
    expect(criteria.id).toBe('rt-1');
    expect(criteria.revokedAt.type).toBe('isNull');
    const patch = update.mock.calls[0]?.[1] as { revokedAt: Date };
    expect(patch.revokedAt).toBeInstanceOf(Date);
  });

  it('markReplaced sets replacedByTokenId and revokedAt', async () => {
    update.mockResolvedValue({ affected: 1 });

    await service.markReplaced('rt-old', 'rt-new');

    expect(update.mock.calls[0]?.[0]).toEqual({ id: 'rt-old' });
    const patch = update.mock.calls[0]?.[1] as {
      replacedByTokenId: string;
      revokedAt: Date;
    };
    expect(patch.replacedByTokenId).toBe('rt-new');
    expect(patch.revokedAt).toBeInstanceOf(Date);
  });

  it('collectFamilyTokenIds walks forward and backward along replaced_by chain', async () => {
    findOne
      .mockResolvedValueOnce({ id: 'rt-2', replacedByTokenId: 'rt-3' })
      .mockResolvedValueOnce({ id: 'rt-3', replacedByTokenId: null })
      .mockResolvedValueOnce({ id: 'rt-1', replacedByTokenId: 'rt-2' })
      .mockResolvedValueOnce(null);

    const ids = await service.collectFamilyTokenIds('rt-2');

    expect(ids).toEqual(['rt-2', 'rt-3', 'rt-1']);
  });

  it('revokeTokenFamily revokes only non-revoked rows in the family', async () => {
    findOne
      .mockResolvedValueOnce({ id: 'rt-2', replacedByTokenId: null })
      .mockResolvedValueOnce(null);
    update.mockResolvedValue({ affected: 1 });

    await service.revokeTokenFamily('rt-2');

    expect(update).toHaveBeenCalledOnce();
    const criteria = update.mock.calls[0]?.[0] as {
      id: { type: string; value: string[] };
      revokedAt: { type: string };
    };
    expect(criteria.id.value).toEqual(['rt-2']);
    expect(criteria.revokedAt.type).toBe('isNull');
    const patch = update.mock.calls[0]?.[1] as { revokedAt: Date };
    expect(patch.revokedAt).toBeInstanceOf(Date);
  });
});
