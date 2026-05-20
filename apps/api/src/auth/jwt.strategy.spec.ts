import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { INVALID_ACCESS_TOKEN_MESSAGE } from './auth-jwt.constants';
import { JwtAccessTokenService } from './jwt-access-token.service';
import { JwtStrategy } from './jwt.strategy';

function requestWithAuthorization(authorization: string | undefined): Request {
  return {
    headers: authorization === undefined ? {} : { authorization },
  } as Request;
}

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let verify: ReturnType<typeof vi.fn>;
  let accessTokens: JwtAccessTokenService;

  beforeEach(() => {
    verify = vi.fn();
    accessTokens = { verify } as unknown as JwtAccessTokenService;
    strategy = new JwtStrategy(accessTokens);
  });

  it('throws UnauthorizedException when Authorization header is missing', async () => {
    await expect(
      strategy.validate(requestWithAuthorization(undefined)),
    ).rejects.toThrow(new UnauthorizedException(INVALID_ACCESS_TOKEN_MESSAGE));
    expect(verify).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when Bearer token is empty', async () => {
    await expect(
      strategy.validate(requestWithAuthorization('Bearer ')),
    ).rejects.toThrow(new UnauthorizedException(INVALID_ACCESS_TOKEN_MESSAGE));
    expect(verify).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when Authorization is not Bearer', async () => {
    await expect(
      strategy.validate(requestWithAuthorization('Basic dXNlcjpwYXNz')),
    ).rejects.toThrow(new UnauthorizedException(INVALID_ACCESS_TOKEN_MESSAGE));
    expect(verify).not.toHaveBeenCalled();
  });

  it('delegates verify to JwtAccessTokenService for a Bearer token', async () => {
    verify.mockResolvedValue({ sub: '11111111-1111-4111-8111-111111111111' });

    const result = await strategy.validate(
      requestWithAuthorization('Bearer valid.jwt.token'),
    );

    expect(verify).toHaveBeenCalledWith('valid.jwt.token');
    expect(result).toEqual({ sub: '11111111-1111-4111-8111-111111111111' });
  });

  it('propagates UnauthorizedException from JwtAccessTokenService', async () => {
    verify.mockRejectedValue(
      new UnauthorizedException(INVALID_ACCESS_TOKEN_MESSAGE),
    );

    await expect(
      strategy.validate(requestWithAuthorization('Bearer bad.token')),
    ).rejects.toThrow(new UnauthorizedException(INVALID_ACCESS_TOKEN_MESSAGE));
  });
});
