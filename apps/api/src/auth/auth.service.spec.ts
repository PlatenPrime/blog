import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PasswordHasherService } from '../users/password-hasher.service';
import type { User } from '../users/user.entity';
import { UserService } from '../users/user.service';
import {
  INVALID_LOGIN_CREDENTIALS_MESSAGE,
  INVALID_REFRESH_TOKEN_MESSAGE,
} from './auth-credentials.constants';
import { AuthService } from './auth.service';
import type { CreateLoginBodyDto } from './dto/create-login-body.dto';
import type { CreateRefreshBodyDto } from './dto/create-refresh-body.dto';
import type { CreateRegisterBodyDto } from './dto/create-register-body.dto';
import type { RefreshToken } from './refresh-token.entity';
import { JwtAccessTokenService } from './jwt-access-token.service';
import { RefreshTokenService } from './refresh-token.service';

describe('AuthService', () => {
  let service: AuthService;
  let create: ReturnType<typeof vi.fn>;
  let findByEmail: ReturnType<typeof vi.fn>;
  let verify: ReturnType<typeof vi.fn>;
  let signForUser: ReturnType<typeof vi.fn>;
  let persistForUser: ReturnType<typeof vi.fn>;
  let findActiveByRawToken: ReturnType<typeof vi.fn>;
  let findByRawToken: ReturnType<typeof vi.fn>;
  let revoke: ReturnType<typeof vi.fn>;
  let revokeTokenFamily: ReturnType<typeof vi.fn>;
  let markReplaced: ReturnType<typeof vi.fn>;
  let users: UserService;
  let passwordHasher: PasswordHasherService;
  let accessTokens: JwtAccessTokenService;
  let refreshTokens: RefreshTokenService;
  let config: ConfigService;
  const refreshTtlMs = 60_000;

  const savedUser: User = {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'user@example.com',
    passwordHash: 'argon2id$v=19$m=65536,t=3,p=4$hash',
    createdAt: new Date('2026-05-20T10:00:00.000Z'),
    updatedAt: new Date('2026-05-20T10:00:00.000Z'),
  };

  beforeEach(() => {
    create = vi.fn();
    findByEmail = vi.fn();
    verify = vi.fn();
    signForUser = vi.fn();
    persistForUser = vi.fn();
    findActiveByRawToken = vi.fn();
    findByRawToken = vi.fn();
    revoke = vi.fn();
    revokeTokenFamily = vi.fn();
    markReplaced = vi.fn();
    users = { create, findByEmail } as unknown as UserService;
    passwordHasher = { verify } as unknown as PasswordHasherService;
    accessTokens = { signForUser } as unknown as JwtAccessTokenService;
    refreshTokens = {
      persistForUser,
      findActiveByRawToken,
      findByRawToken,
      revoke,
      revokeTokenFamily,
      markReplaced,
    } as unknown as RefreshTokenService;
    config = {
      getOrThrow: vi.fn((key: string) => {
        if (key === 'JWT_REFRESH_EXPIRES_MS') {
          return refreshTtlMs;
        }
        throw new Error(`unexpected config key: ${key}`);
      }),
    } as unknown as ConfigService;
    service = new AuthService(
      users,
      passwordHasher,
      accessTokens,
      refreshTokens,
      config,
    );
  });

  it('register delegates to UserService.create with email and plainPassword', async () => {
    create.mockResolvedValue(savedUser);
    const dto: CreateRegisterBodyDto = {
      email: 'user@example.com',
      password: 'secret123',
    };

    await service.register(dto);

    expect(create).toHaveBeenCalledWith({
      email: 'user@example.com',
      plainPassword: 'secret123',
    });
  });

  it('register returns RegisterUserResponse without passwordHash', async () => {
    create.mockResolvedValue(savedUser);
    const dto: CreateRegisterBodyDto = {
      email: 'user@example.com',
      password: 'secret123',
    };

    const result = await service.register(dto);

    expect(result).toEqual({
      id: savedUser.id,
      email: savedUser.email,
      createdAt: savedUser.createdAt.toISOString(),
      updatedAt: savedUser.updatedAt.toISOString(),
    });
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('login returns LoginUserResponse with accessToken and refreshToken when credentials are valid', async () => {
    findByEmail.mockResolvedValue(savedUser);
    verify.mockResolvedValue(true);
    signForUser.mockResolvedValue('signed-access-token');
    persistForUser.mockResolvedValue({ id: 'rt-1' });
    const dto: CreateLoginBodyDto = {
      email: 'user@example.com',
      password: 'secret123',
    };

    const result = await service.login(dto);

    expect(findByEmail).toHaveBeenCalledWith('user@example.com');
    expect(verify).toHaveBeenCalledWith('secret123', savedUser.passwordHash);
    expect(signForUser).toHaveBeenCalledWith(savedUser.id);
    expect(persistForUser).toHaveBeenCalledOnce();
    const persistArgs = persistForUser.mock.calls[0]?.[0] as {
      userId: string;
      rawToken: string;
      expiresAt: Date;
    };
    expect(persistArgs.userId).toBe(savedUser.id);
    expect(typeof persistArgs.rawToken).toBe('string');
    expect(persistArgs.expiresAt).toBeInstanceOf(Date);
    const expiresDeltaMs =
      persistArgs.expiresAt.getTime() - Date.now() - refreshTtlMs;
    expect(Math.abs(expiresDeltaMs)).toBeLessThan(2_000);
    expect(result).toMatchObject({
      id: savedUser.id,
      email: savedUser.email,
      createdAt: savedUser.createdAt.toISOString(),
      updatedAt: savedUser.updatedAt.toISOString(),
      accessToken: 'signed-access-token',
    });
    expect(typeof result.refreshToken).toBe('string');
    expect(result.refreshToken.length).toBeGreaterThan(0);
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('login throws UnauthorizedException when user is not found', async () => {
    findByEmail.mockResolvedValue(null);
    const dto: CreateLoginBodyDto = {
      email: 'missing@example.com',
      password: 'secret123',
    };

    await expect(service.login(dto)).rejects.toThrow(
      new UnauthorizedException(INVALID_LOGIN_CREDENTIALS_MESSAGE),
    );
    expect(verify).not.toHaveBeenCalled();
    expect(persistForUser).not.toHaveBeenCalled();
  });

  it('login throws UnauthorizedException when password does not match', async () => {
    findByEmail.mockResolvedValue(savedUser);
    verify.mockResolvedValue(false);
    const dto: CreateLoginBodyDto = {
      email: 'user@example.com',
      password: 'wrong-password',
    };

    await expect(service.login(dto)).rejects.toThrow(
      new UnauthorizedException(INVALID_LOGIN_CREDENTIALS_MESSAGE),
    );
    expect(persistForUser).not.toHaveBeenCalled();
  });

  it('refresh rotates token and returns new access and refresh tokens', async () => {
    const existing = {
      id: 'rt-old',
      userId: savedUser.id,
    } as RefreshToken;
    const successor = { id: 'rt-new' } as RefreshToken;
    findActiveByRawToken.mockResolvedValue(existing);
    persistForUser.mockResolvedValue(successor);
    signForUser.mockResolvedValue('new-access-token');

    const dto: CreateRefreshBodyDto = {
      refreshToken: 'opaque-refresh-secret-value',
    };

    const result = await service.refresh(dto);

    expect(findActiveByRawToken).toHaveBeenCalledWith(dto.refreshToken);
    expect(persistForUser).toHaveBeenCalledOnce();
    const rotatePersistArgs = persistForUser.mock.calls[0]?.[0] as {
      userId: string;
      rawToken: string;
      expiresAt: Date;
    };
    expect(rotatePersistArgs.userId).toBe(savedUser.id);
    expect(typeof rotatePersistArgs.rawToken).toBe('string');
    expect(rotatePersistArgs.expiresAt).toBeInstanceOf(Date);
    const rotateExpiresDeltaMs =
      rotatePersistArgs.expiresAt.getTime() - Date.now() - refreshTtlMs;
    expect(Math.abs(rotateExpiresDeltaMs)).toBeLessThan(2_000);
    expect(markReplaced).toHaveBeenCalledWith('rt-old', 'rt-new');
    expect(signForUser).toHaveBeenCalledWith(savedUser.id);
    expect(result.accessToken).toBe('new-access-token');
    expect(typeof result.refreshToken).toBe('string');
    expect(result.refreshToken).not.toBe(dto.refreshToken);
  });

  it('refresh throws UnauthorizedException when token is not active', async () => {
    findActiveByRawToken.mockResolvedValue(null);
    findByRawToken.mockResolvedValue(null);
    const dto: CreateRefreshBodyDto = {
      refreshToken: 'unknown-or-revoked-token',
    };

    await expect(service.refresh(dto)).rejects.toThrow(
      new UnauthorizedException(INVALID_REFRESH_TOKEN_MESSAGE),
    );
    expect(findByRawToken).toHaveBeenCalledWith(dto.refreshToken);
    expect(persistForUser).not.toHaveBeenCalled();
    expect(markReplaced).not.toHaveBeenCalled();
    expect(revokeTokenFamily).not.toHaveBeenCalled();
  });

  it('refresh revokes token family and throws when rotated token is reused', async () => {
    findActiveByRawToken.mockResolvedValue(null);
    findByRawToken.mockResolvedValue({
      id: 'rt-old',
      revokedAt: new Date('2026-05-20T12:00:00.000Z'),
      replacedByTokenId: 'rt-new',
    });
    revokeTokenFamily.mockResolvedValue(undefined);
    const dto: CreateRefreshBodyDto = {
      refreshToken: 'reused-rotated-token',
    };

    await expect(service.refresh(dto)).rejects.toThrow(
      new UnauthorizedException(INVALID_REFRESH_TOKEN_MESSAGE),
    );
    expect(revokeTokenFamily).toHaveBeenCalledWith('rt-old');
    expect(persistForUser).not.toHaveBeenCalled();
    expect(markReplaced).not.toHaveBeenCalled();
  });

  it('refresh does not revoke family when token was logout-revoked only', async () => {
    findActiveByRawToken.mockResolvedValue(null);
    findByRawToken.mockResolvedValue({
      id: 'rt-1',
      revokedAt: new Date('2026-05-20T12:00:00.000Z'),
      replacedByTokenId: null,
    });
    const dto: CreateRefreshBodyDto = {
      refreshToken: 'logout-revoked-token',
    };

    await expect(service.refresh(dto)).rejects.toThrow(
      new UnauthorizedException(INVALID_REFRESH_TOKEN_MESSAGE),
    );
    expect(revokeTokenFamily).not.toHaveBeenCalled();
  });

  it('logout revokes row when refresh token exists and is not revoked', async () => {
    const row = {
      id: 'rt-1',
      revokedAt: null,
    } as RefreshToken;
    findByRawToken.mockResolvedValue(row);
    revoke.mockResolvedValue(undefined);
    const dto: CreateRefreshBodyDto = {
      refreshToken: 'opaque-refresh-secret-value',
    };

    await service.logout(dto);

    expect(findByRawToken).toHaveBeenCalledWith(dto.refreshToken);
    expect(revoke).toHaveBeenCalledWith('rt-1');
  });

  it('logout does not revoke when row is already revoked', async () => {
    findByRawToken.mockResolvedValue({
      id: 'rt-1',
      revokedAt: new Date('2026-05-20T12:00:00.000Z'),
    });
    const dto: CreateRefreshBodyDto = {
      refreshToken: 'opaque-refresh-secret-value',
    };

    await service.logout(dto);

    expect(revoke).not.toHaveBeenCalled();
  });

  it('logout resolves without revoking when token is unknown', async () => {
    findByRawToken.mockResolvedValue(null);
    const dto: CreateRefreshBodyDto = {
      refreshToken: 'unknown-refresh-token',
    };

    await expect(service.logout(dto)).resolves.toBeUndefined();
    expect(revoke).not.toHaveBeenCalled();
  });
});
