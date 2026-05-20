import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordHasherService } from './password-hasher.service';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly passwordHasher: PasswordHasherService,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.users.findOne({ where: { email } });
  }

  async create(params: {
    email: string;
    plainPassword: string;
  }): Promise<User> {
    const passwordHash = await this.passwordHasher.hash(params.plainPassword);
    const user = this.users.create({
      email: params.email,
      passwordHash,
    });
    return this.users.save(user);
  }
}
