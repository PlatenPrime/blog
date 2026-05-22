import type { JwtAccessTokenPayload } from '@blog/shared-contracts';
import { UnauthorizedException } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { INVALID_ACCESS_TOKEN_MESSAGE } from './auth-jwt.constants';
import { JwtAccessTokenService } from './jwt-access-token.service';

const UNIT_TEST_JWT_SECRET = 'unit-test-jwt-secret-at-least-32-characters-long';

describe('JwtAccessTokenService', () => {
  let service: JwtAccessTokenService;
  let jwtService: JwtService;

  const userId = '11111111-1111-4111-8111-111111111111';

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: UNIT_TEST_JWT_SECRET,
          signOptions: { expiresIn: '15m', algorithm: 'HS256' },
        }),
      ],
      providers: [JwtAccessTokenService],
    }).compile();

    service = moduleRef.get(JwtAccessTokenService);
    jwtService = moduleRef.get(JwtService);
  });

  it('signForUser and verify round-trip with shared-contracts JwtAccessTokenPayload', async () => {
    const token = await service.signForUser(userId);

    const payload: JwtAccessTokenPayload = await service.verify(token);
    expect(payload).toEqual({ sub: userId });
  });

  it('verify throws UnauthorizedException when token is expired', async () => {
    const expiredToken = await jwtService.signAsync(
      { sub: userId },
      { expiresIn: '-1s' },
    );

    await expect(service.verify(expiredToken)).rejects.toThrow(
      new UnauthorizedException(INVALID_ACCESS_TOKEN_MESSAGE),
    );
  });

  it('verify throws UnauthorizedException when signed with a different secret', async () => {
    const otherModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'other-jwt-secret-at-least-32-characters-long',
          signOptions: { expiresIn: '15m', algorithm: 'HS256' },
        }),
      ],
      providers: [JwtAccessTokenService],
    }).compile();
    const otherService = otherModule.get(JwtAccessTokenService);
    const token = await otherService.signForUser(userId);

    await expect(service.verify(token)).rejects.toThrow(
      new UnauthorizedException(INVALID_ACCESS_TOKEN_MESSAGE),
    );
  });

  it('verify throws UnauthorizedException for malformed token', async () => {
    await expect(service.verify('not.a.jwt')).rejects.toThrow(
      new UnauthorizedException(INVALID_ACCESS_TOKEN_MESSAGE),
    );
  });

  it('verify throws UnauthorizedException when sub claim is missing', async () => {
    const tokenWithoutSub = await jwtService.signAsync({});

    await expect(service.verify(tokenWithoutSub)).rejects.toThrow(
      new UnauthorizedException(INVALID_ACCESS_TOKEN_MESSAGE),
    );
  });

  it('verify throws UnauthorizedException when sub claim is empty', async () => {
    const tokenWithEmptySub = await jwtService.signAsync({ sub: '   ' });

    await expect(service.verify(tokenWithEmptySub)).rejects.toThrow(
      new UnauthorizedException(INVALID_ACCESS_TOKEN_MESSAGE),
    );
  });
});
