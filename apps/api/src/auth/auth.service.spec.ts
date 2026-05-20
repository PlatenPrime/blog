import { UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PasswordHasherService } from '../users/password-hasher.service';
import type { User } from '../users/user.entity';
import { UserService } from '../users/user.service';
import { INVALID_LOGIN_CREDENTIALS_MESSAGE } from './auth-credentials.constants';
import { AuthService } from './auth.service';
import { JwtAccessTokenService } from './jwt-access-token.service';
import type { CreateLoginBodyDto } from './dto/create-login-body.dto';
import type { CreateRegisterBodyDto } from './dto/create-register-body.dto';

describe('AuthService', () => {
  let service: AuthService;
  let create: ReturnType<typeof vi.fn>;
  let findByEmail: ReturnType<typeof vi.fn>;
  let verify: ReturnType<typeof vi.fn>;
  let signForUser: ReturnType<typeof vi.fn>;
  let users: UserService;
  let passwordHasher: PasswordHasherService;
  let accessTokens: JwtAccessTokenService;

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
    users = { create, findByEmail } as unknown as UserService;
    passwordHasher = { verify } as unknown as PasswordHasherService;
    accessTokens = { signForUser } as unknown as JwtAccessTokenService;
    service = new AuthService(users, passwordHasher, accessTokens);
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

  it('login returns LoginUserResponse with accessToken when credentials are valid', async () => {
    findByEmail.mockResolvedValue(savedUser);
    verify.mockResolvedValue(true);
    signForUser.mockResolvedValue('signed-access-token');
    const dto: CreateLoginBodyDto = {
      email: 'user@example.com',
      password: 'secret123',
    };

    const result = await service.login(dto);

    expect(findByEmail).toHaveBeenCalledWith('user@example.com');
    expect(verify).toHaveBeenCalledWith('secret123', savedUser.passwordHash);
    expect(signForUser).toHaveBeenCalledWith(savedUser.id);
    expect(result).toEqual({
      id: savedUser.id,
      email: savedUser.email,
      createdAt: savedUser.createdAt.toISOString(),
      updatedAt: savedUser.updatedAt.toISOString(),
      accessToken: 'signed-access-token',
    });
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
  });
});
