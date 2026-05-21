import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, type Repository } from 'typeorm';
import { hashPasswordResetToken } from './password-reset-token-hash';
import { PasswordResetToken } from './password-reset-token.entity';

@Injectable()
export class PasswordResetTokenService {
  constructor(
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokens: Repository<PasswordResetToken>,
  ) {}

  async persistForUser(params: {
    userId: string;
    rawToken: string;
    expiresAt: Date;
  }): Promise<PasswordResetToken> {
    const token = this.passwordResetTokens.create({
      userId: params.userId,
      tokenHash: hashPasswordResetToken(params.rawToken),
      expiresAt: params.expiresAt,
      consumedAt: null,
    });
    return this.passwordResetTokens.save(token);
  }

  findByRawToken(rawToken: string): Promise<PasswordResetToken | null> {
    const tokenHash = hashPasswordResetToken(rawToken);
    return this.passwordResetTokens.findOne({ where: { tokenHash } });
  }

  findActiveByRawToken(rawToken: string): Promise<PasswordResetToken | null> {
    const tokenHash = hashPasswordResetToken(rawToken);
    return this.passwordResetTokens.findOne({
      where: {
        tokenHash,
        consumedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });
  }

  async consume(id: string): Promise<void> {
    await this.passwordResetTokens.update(
      { id, consumedAt: IsNull() },
      { consumedAt: new Date() },
    );
  }

  async invalidateActiveForUser(userId: string): Promise<void> {
    await this.passwordResetTokens.update(
      {
        userId,
        consumedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      { consumedAt: new Date() },
    );
  }
}
