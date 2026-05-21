import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, type Repository } from 'typeorm';
import { hashEmailVerificationToken } from './email-verification-token-hash';
import { EmailVerificationToken } from './email-verification-token.entity';

@Injectable()
export class EmailVerificationTokenService {
  constructor(
    @InjectRepository(EmailVerificationToken)
    private readonly emailVerificationTokens: Repository<EmailVerificationToken>,
  ) {}

  async persistForUser(params: {
    userId: string;
    rawToken: string;
    expiresAt: Date;
  }): Promise<EmailVerificationToken> {
    const token = this.emailVerificationTokens.create({
      userId: params.userId,
      tokenHash: hashEmailVerificationToken(params.rawToken),
      expiresAt: params.expiresAt,
      consumedAt: null,
    });
    return this.emailVerificationTokens.save(token);
  }

  findByRawToken(rawToken: string): Promise<EmailVerificationToken | null> {
    const tokenHash = hashEmailVerificationToken(rawToken);
    return this.emailVerificationTokens.findOne({ where: { tokenHash } });
  }

  findActiveByRawToken(
    rawToken: string,
  ): Promise<EmailVerificationToken | null> {
    const tokenHash = hashEmailVerificationToken(rawToken);
    return this.emailVerificationTokens.findOne({
      where: {
        tokenHash,
        consumedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });
  }

  async consume(id: string): Promise<void> {
    await this.emailVerificationTokens.update(
      { id, consumedAt: IsNull() },
      { consumedAt: new Date() },
    );
  }
}
