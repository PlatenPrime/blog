import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { Strategy } from 'passport-custom';
import { INVALID_ACCESS_TOKEN_MESSAGE } from './auth-jwt.constants';
import type { AuthRequestUser } from './auth-request-user.types';
import { JwtAccessTokenService } from './jwt-access-token.service';

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
    return null;
  }
  const token = header.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly accessTokens: JwtAccessTokenService) {
    super();
  }

  async validate(req: Request): Promise<AuthRequestUser> {
    const token = extractBearerToken(req);

    if (token === null) {
      throw new UnauthorizedException(INVALID_ACCESS_TOKEN_MESSAGE);
    }

    return this.accessTokens.verify(token);
  }
}
