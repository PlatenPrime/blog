import type {
  LoginUserResponse,
  RegisterUserResponse,
} from '@blog/shared-contracts';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PasswordHasherService } from '../users/password-hasher.service';
import { UserService } from '../users/user.service';
import { INVALID_LOGIN_CREDENTIALS_MESSAGE } from './auth-credentials.constants';
import type { CreateLoginBodyDto } from './dto/create-login-body.dto';
import type { CreateRegisterBodyDto } from './dto/create-register-body.dto';
import type { User } from '../users/user.entity';
import { JwtAccessTokenService } from './jwt-access-token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserService,
    private readonly passwordHasher: PasswordHasherService,
    private readonly accessTokens: JwtAccessTokenService,
  ) {}

  async register(dto: CreateRegisterBodyDto): Promise<RegisterUserResponse> {
    const user = await this.users.create({
      email: dto.email,
      plainPassword: dto.password,
    });
    return this.toPublicUserResponse(user);
  }

  async login(dto: CreateLoginBodyDto): Promise<LoginUserResponse> {
    const user = await this.users.findByEmail(dto.email);

    if (user === null) {
      throw new UnauthorizedException(INVALID_LOGIN_CREDENTIALS_MESSAGE);
    }

    const passwordMatches = await this.passwordHasher.verify(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException(INVALID_LOGIN_CREDENTIALS_MESSAGE);
    }

    const accessToken = await this.accessTokens.signForUser(user.id);

    return {
      ...this.toPublicUserResponse(user),
      accessToken,
    };
  }

  private toPublicUserResponse(user: User): RegisterUserResponse {
    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
