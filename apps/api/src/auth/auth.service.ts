import type { RegisterUserResponse } from '@blog/shared-contracts';
import { Injectable } from '@nestjs/common';
import { UserService } from '../users/user.service';
import type { CreateRegisterBodyDto } from './dto/create-register-body.dto';
import type { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(private readonly users: UserService) {}

  async register(dto: CreateRegisterBodyDto): Promise<RegisterUserResponse> {
    const user = await this.users.create({
      email: dto.email,
      plainPassword: dto.password,
    });
    return this.toRegisterResponse(user);
  }

  private toRegisterResponse(user: User): RegisterUserResponse {
    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
