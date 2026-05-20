import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Repository } from 'typeorm';
import { PasswordHasherService } from './password-hasher.service';
import type { User } from './user.entity';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let findOne: ReturnType<typeof vi.fn>;
  let create: ReturnType<typeof vi.fn>;
  let save: ReturnType<typeof vi.fn>;
  let hash: ReturnType<typeof vi.fn>;
  let usersRepo: Repository<User>;
  let passwordHasher: PasswordHasherService;

  beforeEach(() => {
    findOne = vi.fn();
    create = vi.fn();
    save = vi.fn();
    hash = vi.fn();

    usersRepo = {
      findOne,
      create,
      save,
    } as unknown as Repository<User>;

    passwordHasher = {
      hash,
    } as unknown as PasswordHasherService;

    service = new UserService(usersRepo, passwordHasher);
  });

  it('findByEmail delegates to repository findOne with email', async () => {
    findOne.mockResolvedValue(null);

    const result = await service.findByEmail('a@b.com');

    expect(findOne).toHaveBeenCalledWith({ where: { email: 'a@b.com' } });
    expect(result).toBeNull();
  });

  it('findByEmail returns user when repository finds one', async () => {
    const user = { id: 'u1', email: 'a@b.com' } as User;
    findOne.mockResolvedValue(user);

    const result = await service.findByEmail('a@b.com');

    expect(result).toBe(user);
  });

  it('create hashes password, saves user with hash, returns saved entity', async () => {
    hash.mockResolvedValue('$argon2id$stub');
    const draft = { email: 'x@y.com', passwordHash: '$argon2id$stub' };
    const saved: User = {
      ...draft,
      id: 'new-id',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    create.mockReturnValue(draft);
    save.mockResolvedValue(saved);

    const result = await service.create({
      email: 'x@y.com',
      plainPassword: 'secret',
    });

    expect(hash).toHaveBeenCalledWith('secret');
    expect(create).toHaveBeenCalledWith({
      email: 'x@y.com',
      passwordHash: '$argon2id$stub',
    });
    expect(save).toHaveBeenCalledWith(draft);
    expect(result).toBe(saved);
  });
});
