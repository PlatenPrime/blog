import type {
  LoginUserResponse,
  RefreshSessionResponse,
  RegisterUserResponse,
} from '@blog/shared-contracts';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PasswordHasherService } from '../users/password-hasher.service';
import { UserService } from '../users/user.service';
import {
  INVALID_LOGIN_CREDENTIALS_MESSAGE,
  INVALID_REFRESH_TOKEN_MESSAGE,
} from './auth-credentials.constants';
import type { CreateLoginBodyDto } from './dto/create-login-body.dto';
import type { CreateRefreshBodyDto } from './dto/create-refresh-body.dto';
import type { CreateRegisterBodyDto } from './dto/create-register-body.dto';
import type { User } from '../users/user.entity';
import { generateOpaqueToken } from './generate-opaque-token';
import { JwtAccessTokenService } from './jwt-access-token.service';
import { DEFAULT_REFRESH_TOKEN_TTL_MS } from './refresh-token.constants';
import { RefreshTokenService } from './refresh-token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserService,
    private readonly passwordHasher: PasswordHasherService,
    private readonly accessTokens: JwtAccessTokenService,
    private readonly refreshTokens: RefreshTokenService,
  ) {}

  async register(dto: CreateRegisterBodyDto): Promise<RegisterUserResponse> {
    const user = await this.users.create({
      email: dto.email,
      plainPassword: dto.password,
    });
    return this.toPublicUserResponse(user);
  }

  async login(dto: CreateLoginBodyDto): Promise<LoginUserResponse> {
    const user = await this.requireUserForCredentials(dto.email, dto.password);
    const accessToken = await this.accessTokens.signForUser(user.id);
    const refreshToken = await this.issueRefreshForUser(user.id);

    return {
      ...this.toPublicUserResponse(user),
      accessToken,
      refreshToken,
    };
  }

  async refresh(dto: CreateRefreshBodyDto): Promise<RefreshSessionResponse> {
    const existing = await this.refreshTokens.findActiveByRawToken(
      dto.refreshToken,
    );

    if (existing === null) {
      throw new UnauthorizedException(INVALID_REFRESH_TOKEN_MESSAGE);
    }

    const rawToken = generateOpaqueToken();
    const expiresAt = this.refreshExpiresAt();
    const successor = await this.refreshTokens.persistForUser({
      userId: existing.userId,
      rawToken,
      expiresAt,
    });
    await this.refreshTokens.markReplaced(existing.id, successor.id);

    const accessToken = await this.accessTokens.signForUser(existing.userId);

    return { accessToken, refreshToken: rawToken };
  }

  async logout(dto: CreateRefreshBodyDto): Promise<void> {
    const row = await this.refreshTokens.findByRawToken(dto.refreshToken);

    if (row !== null && row.revokedAt === null) {
      await this.refreshTokens.revoke(row.id);
    }
  }

  private async requireUserForCredentials(
    email: string,
    password: string,
  ): Promise<User> {
    const user = await this.users.findByEmail(email);

    if (user === null) {
      throw new UnauthorizedException(INVALID_LOGIN_CREDENTIALS_MESSAGE);
    }

    const passwordMatches = await this.passwordHasher.verify(
      password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException(INVALID_LOGIN_CREDENTIALS_MESSAGE);
    }

    return user;
  }

  private async issueRefreshForUser(userId: string): Promise<string> {
    const rawToken = generateOpaqueToken();
    await this.refreshTokens.persistForUser({
      userId,
      rawToken,
      expiresAt: this.refreshExpiresAt(),
    });
    return rawToken;
  }

  private refreshExpiresAt(): Date {
    return new Date(Date.now() + DEFAULT_REFRESH_TOKEN_TTL_MS);
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
