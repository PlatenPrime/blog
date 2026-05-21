import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isPostgresUniqueViolation } from '../database/is-postgres-unique-violation';
import { normalizeUserEmail } from './normalize-user-email';
import { PasswordHasherService } from './password-hasher.service';
import {
  USER_EMAIL_ALREADY_REGISTERED_MESSAGE,
  USERS_EMAIL_UNIQUE_CONSTRAINT,
} from './user-email.constants';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly passwordHasher: PasswordHasherService,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = normalizeUserEmail(email);
    return this.users.findOne({ where: { email: normalizedEmail } });
  }

  async create(params: {
    email: string;
    plainPassword: string;
  }): Promise<User> {
    const email = normalizeUserEmail(params.email);
    const existing = await this.findByEmail(email);

    if (existing !== null) {
      throw new ConflictException(USER_EMAIL_ALREADY_REGISTERED_MESSAGE);
    }

    const passwordHash = await this.passwordHasher.hash(params.plainPassword);
    const user = this.users.create({
      email,
      passwordHash,
    });

    try {
      return await this.users.save(user);
    } catch (error: unknown) {
      if (isPostgresUniqueViolation(error, USERS_EMAIL_UNIQUE_CONSTRAINT)) {
        throw new ConflictException(USER_EMAIL_ALREADY_REGISTERED_MESSAGE);
      }

      throw error;
    }
  }

  async markEmailVerified(userId: string): Promise<User> {
    const existing = await this.users.findOne({ where: { id: userId } });

    if (existing === null) {
      throw new NotFoundException();
    }

    if (existing.emailVerifiedAt !== null) {
      return existing;
    }

    const verifiedAt = new Date();
    await this.users.update({ id: userId }, { emailVerifiedAt: verifiedAt });

    return { ...existing, emailVerifiedAt: verifiedAt };
  }
}
