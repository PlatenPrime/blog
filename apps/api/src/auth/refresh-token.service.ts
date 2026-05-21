import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, type Repository } from 'typeorm';
import { hashRefreshToken } from './refresh-token-hash';
import { RefreshToken } from './refresh-token.entity';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokens: Repository<RefreshToken>,
  ) {}

  async persistForUser(params: {
    userId: string;
    rawToken: string;
    expiresAt: Date;
  }): Promise<RefreshToken> {
    const token = this.refreshTokens.create({
      userId: params.userId,
      tokenHash: hashRefreshToken(params.rawToken),
      expiresAt: params.expiresAt,
      revokedAt: null,
      replacedByTokenId: null,
    });
    return this.refreshTokens.save(token);
  }

  findByRawToken(rawToken: string): Promise<RefreshToken | null> {
    const tokenHash = hashRefreshToken(rawToken);
    return this.refreshTokens.findOne({ where: { tokenHash } });
  }

  findActiveByRawToken(rawToken: string): Promise<RefreshToken | null> {
    const tokenHash = hashRefreshToken(rawToken);
    return this.refreshTokens.findOne({
      where: {
        tokenHash,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });
  }

  async revoke(id: string): Promise<void> {
    await this.refreshTokens.update(
      { id, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async markReplaced(id: string, replacedById: string): Promise<void> {
    await this.refreshTokens.update(
      { id },
      { replacedByTokenId: replacedById, revokedAt: new Date() },
    );
  }
}
