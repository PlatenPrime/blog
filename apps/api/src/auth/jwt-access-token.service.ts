import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { INVALID_ACCESS_TOKEN_MESSAGE } from './auth-jwt.constants';
import type { JwtAccessTokenPayload } from './jwt-access-token.payload';

@Injectable()
export class JwtAccessTokenService {
  constructor(private readonly jwt: JwtService) {}

  async signForUser(userId: string): Promise<string> {
    return this.jwt.signAsync({ sub: userId } satisfies JwtAccessTokenPayload);
  }

  async verify(token: string): Promise<JwtAccessTokenPayload> {
    try {
      const payload =
        await this.jwt.verifyAsync<Record<string, unknown>>(token);
      const sub = payload.sub;
      if (typeof sub !== 'string' || sub.trim().length === 0) {
        throw new UnauthorizedException(INVALID_ACCESS_TOKEN_MESSAGE);
      }
      return { sub };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(INVALID_ACCESS_TOKEN_MESSAGE);
    }
  }
}
