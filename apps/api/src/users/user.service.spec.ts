import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryFailedError, type Repository } from 'typeorm';
import { PasswordHasherService } from './password-hasher.service';
import { USER_EMAIL_ALREADY_REGISTERED_MESSAGE } from './user-email.constants';
import type { User } from './user.entity';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let findOne: ReturnType<typeof vi.fn>;
  let create: ReturnType<typeof vi.fn>;
  let save: ReturnType<typeof vi.fn>;
  let update: ReturnType<typeof vi.fn>;
  let hash: ReturnType<typeof vi.fn>;
  let usersRepo: Repository<User>;
  let passwordHasher: PasswordHasherService;

  beforeEach(() => {
    findOne = vi.fn();
    create = vi.fn();
    save = vi.fn();
    update = vi.fn();
    hash = vi.fn();

    usersRepo = {
      findOne,
      create,
      save,
      update,
    } as unknown as Repository<User>;

    passwordHasher = {
      hash,
    } as unknown as PasswordHasherService;

    service = new UserService(usersRepo, passwordHasher);
  });

  it('findByEmail normalizes email before repository lookup', async () => {
    findOne.mockResolvedValue(null);

    await service.findByEmail('  User@Example.COM  ');

    expect(findOne).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
    });
  });

  it('findByEmail returns user when repository finds one', async () => {
    const user = { id: 'u1', email: 'a@b.com' } as User;
    findOne.mockResolvedValue(user);

    const result = await service.findByEmail('a@b.com');

    expect(result).toBe(user);
  });

  it('findById looks up user by primary key', async () => {
    const user = { id: 'u1', email: 'a@b.com' } as User;
    findOne.mockResolvedValue(user);

    const result = await service.findById('u1');

    expect(findOne).toHaveBeenCalledWith({ where: { id: 'u1' } });
    expect(result).toBe(user);
  });

  it('create normalizes email, hashes password, saves user with hash', async () => {
    findOne.mockResolvedValue(null);
    hash.mockResolvedValue('$argon2id$stub');
    const draft = { email: 'x@y.com', passwordHash: '$argon2id$stub' };
    const saved: User = {
      ...draft,
      id: 'new-id',
      emailVerifiedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    create.mockReturnValue(draft);
    save.mockResolvedValue(saved);

    const result = await service.create({
      email: '  X@Y.COM  ',
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

  it('create throws ConflictException when email already exists', async () => {
    findOne.mockResolvedValue({ id: 'existing', email: 'user@example.com' });

    await expect(
      service.create({
        email: 'User@Example.com',
        plainPassword: 'secret',
      }),
    ).rejects.toMatchObject({
      response: {
        message: USER_EMAIL_ALREADY_REGISTERED_MESSAGE,
        statusCode: 409,
      },
    });

    expect(hash).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it('create maps unique violation on save to ConflictException', async () => {
    findOne.mockResolvedValue(null);
    hash.mockResolvedValue('$argon2id$stub');
    create.mockReturnValue({
      email: 'x@y.com',
      passwordHash: '$argon2id$stub',
    });
    save.mockRejectedValue(
      new QueryFailedError(
        'INSERT',
        [],
        Object.assign(new Error('unique violation'), {
          code: '23505',
          constraint: 'UQ_users_email',
        }),
      ),
    );

    await expect(
      service.create({ email: 'x@y.com', plainPassword: 'secret' }),
    ).rejects.toMatchObject({
      response: {
        message: USER_EMAIL_ALREADY_REGISTERED_MESSAGE,
        statusCode: 409,
      },
    });
  });

  it('updatePassword hashes password and updates passwordHash', async () => {
    const user: User = {
      id: 'u1',
      email: 'a@b.com',
      passwordHash: 'old-hash',
      emailVerifiedAt: null,
      createdAt: new Date('2026-05-20T10:00:00.000Z'),
      updatedAt: new Date('2026-05-20T10:00:00.000Z'),
    };
    findOne.mockResolvedValue(user);
    hash.mockResolvedValue('$argon2id$new');
    update.mockResolvedValue({ affected: 1 });

    const result = await service.updatePassword('u1', 'new-secret');

    expect(hash).toHaveBeenCalledWith('new-secret');
    const updateCall = update.mock.calls[0] as [
      { id: string },
      { passwordHash: string; updatedAt: Date },
    ];
    expect(updateCall[0]).toEqual({ id: 'u1' });
    expect(updateCall[1].passwordHash).toBe('$argon2id$new');
    expect(updateCall[1].updatedAt).toBeInstanceOf(Date);
    expect(result.passwordHash).toBe('$argon2id$new');
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('updatePassword throws NotFoundException when user does not exist', async () => {
    findOne.mockResolvedValue(null);

    await expect(
      service.updatePassword('missing', 'new-secret'),
    ).rejects.toMatchObject({
      status: 404,
    });
    expect(hash).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('markEmailVerified sets emailVerifiedAt when user is not yet verified', async () => {
    const user: User = {
      id: 'u1',
      email: 'a@b.com',
      passwordHash: 'hash',
      emailVerifiedAt: null,
      createdAt: new Date('2026-05-20T10:00:00.000Z'),
      updatedAt: new Date('2026-05-20T10:00:00.000Z'),
    };
    findOne.mockResolvedValue(user);
    update.mockResolvedValue({ affected: 1 });

    const result = await service.markEmailVerified('u1');

    const updateCall = update.mock.calls[0] as [
      { id: string },
      { emailVerifiedAt: Date },
    ];
    expect(updateCall[0]).toEqual({ id: 'u1' });
    expect(updateCall[1].emailVerifiedAt).toBeInstanceOf(Date);
    expect(result.emailVerifiedAt).toBeInstanceOf(Date);
  });

  it('markEmailVerified is idempotent when email is already verified', async () => {
    const verifiedAt = new Date('2026-05-19T08:00:00.000Z');
    const user: User = {
      id: 'u1',
      email: 'a@b.com',
      passwordHash: 'hash',
      emailVerifiedAt: verifiedAt,
      createdAt: new Date('2026-05-20T10:00:00.000Z'),
      updatedAt: new Date('2026-05-20T10:00:00.000Z'),
    };
    findOne.mockResolvedValue(user);

    const result = await service.markEmailVerified('u1');

    expect(result.emailVerifiedAt).toBe(verifiedAt);
    expect(update).not.toHaveBeenCalled();
  });

  it('markEmailVerified throws NotFoundException when user does not exist', async () => {
    findOne.mockResolvedValue(null);

    await expect(service.markEmailVerified('missing')).rejects.toMatchObject({
      status: 404,
    });
    expect(update).not.toHaveBeenCalled();
  });
});
