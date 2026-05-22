import { ConflictException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { USER_EMAIL_ALREADY_REGISTERED_MESSAGE } from '../../src/users/user-email.constants';
import { normalizeUserEmail } from '../../src/users/normalize-user-email';
import type { PasswordHasherService } from '../../src/users/password-hasher.service';
import type { User } from '../../src/users/user.entity';

/** In-memory UserService shape for auth flow e2e (register → login share state). */
export type InMemoryUserServiceOverride = {
  create: (params: { email: string; plainPassword: string }) => Promise<User>;
  findByEmail: (email: string) => Promise<User | null>;
};

export function createInMemoryUserServiceOverride(
  passwordHasher: PasswordHasherService,
): InMemoryUserServiceOverride {
  const usersByEmail = new Map<string, User>();

  return {
    async create(params: {
      email: string;
      plainPassword: string;
    }): Promise<User> {
      const email = normalizeUserEmail(params.email);
      const existing = usersByEmail.get(email);

      if (existing !== undefined) {
        throw new ConflictException(USER_EMAIL_ALREADY_REGISTERED_MESSAGE);
      }

      const now = new Date();
      const passwordHash = await passwordHasher.hash(params.plainPassword);
      const user: User = {
        id: randomUUID(),
        email,
        passwordHash,
        emailVerifiedAt: null,
        createdAt: now,
        updatedAt: now,
      };

      usersByEmail.set(email, user);
      return user;
    },

    findByEmail(email: string): Promise<User | null> {
      const normalizedEmail = normalizeUserEmail(email);
      return Promise.resolve(usersByEmail.get(normalizedEmail) ?? null);
    },
  };
}
