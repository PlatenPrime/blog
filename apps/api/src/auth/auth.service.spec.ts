import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '../users/user.entity';
import { UserService } from '../users/user.service';
import { AuthService } from './auth.service';
import type { CreateRegisterBodyDto } from './dto/create-register-body.dto';

describe('AuthService', () => {
  let service: AuthService;
  let create: ReturnType<typeof vi.fn>;
  let users: UserService;

  const savedUser: User = {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'user@example.com',
    passwordHash: 'argon2id$v=19$m=65536,t=3,p=4$hash',
    createdAt: new Date('2026-05-20T10:00:00.000Z'),
    updatedAt: new Date('2026-05-20T10:00:00.000Z'),
  };

  beforeEach(() => {
    create = vi.fn();
    users = { create, findByEmail: vi.fn() } as unknown as UserService;
    service = new AuthService(users);
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
});
