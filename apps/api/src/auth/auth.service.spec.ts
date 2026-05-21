import { UnauthorizedException } from '@nestjs/common';
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
  let markReplaced: ReturnType<typeof vi.fn>;
  let users: UserService;
  let passwordHasher: PasswordHasherService;
  let accessTokens: JwtAccessTokenService;
  let refreshTokens: RefreshTokenService;

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
    markReplaced = vi.fn();
    users = { create, findByEmail } as unknown as UserService;
    passwordHasher = { verify } as unknown as PasswordHasherService;
    accessTokens = { signForUser } as unknown as JwtAccessTokenService;
    refreshTokens = {
      persistForUser,
      findActiveByRawToken,
      markReplaced,
    } as unknown as RefreshTokenService;
    service = new AuthService(
      users,
      passwordHasher,
      accessTokens,
      refreshTokens,
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
    expect(markReplaced).toHaveBeenCalledWith('rt-old', 'rt-new');
    expect(signForUser).toHaveBeenCalledWith(savedUser.id);
    expect(result.accessToken).toBe('new-access-token');
    expect(typeof result.refreshToken).toBe('string');
    expect(result.refreshToken).not.toBe(dto.refreshToken);
  });

  it('refresh throws UnauthorizedException when token is not active', async () => {
    findActiveByRawToken.mockResolvedValue(null);
    const dto: CreateRefreshBodyDto = {
      refreshToken: 'unknown-or-revoked-token',
    };

    await expect(service.refresh(dto)).rejects.toThrow(
      new UnauthorizedException(INVALID_REFRESH_TOKEN_MESSAGE),
    );
    expect(persistForUser).not.toHaveBeenCalled();
    expect(markReplaced).not.toHaveBeenCalled();
  });
});
