import type {
  LoginUserResponse,
  RefreshSessionResponse,
  RegisterUserResponse,
  RequestPasswordResetResponse,
  ResetPasswordResponse,
  VerifyEmailResponse,
} from '@blog/shared-contracts';
import {
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SecurityAuditEventType,
  SecurityAuditService,
} from '../security-audit';
import { PasswordHasherService } from '../users/password-hasher.service';
import { UserService } from '../users/user.service';
import {
  INVALID_EMAIL_VERIFICATION_TOKEN_MESSAGE,
  INVALID_LOGIN_CREDENTIALS_MESSAGE,
  INVALID_PASSWORD_RESET_TOKEN_MESSAGE,
  INVALID_REFRESH_TOKEN_MESSAGE,
  PASSWORD_RESET_COMPLETED_MESSAGE,
  PASSWORD_RESET_REQUEST_ACCEPTED_MESSAGE,
} from './auth-credentials.constants';
import type { CreateLoginBodyDto } from './dto/create-login-body.dto';
import type { CreateRefreshBodyDto } from './dto/create-refresh-body.dto';
import type { CreateRegisterBodyDto } from './dto/create-register-body.dto';
import type { CreateRequestPasswordResetBodyDto } from './dto/create-request-password-reset-body.dto';
import type { CreateResetPasswordBodyDto } from './dto/create-reset-password-body.dto';
import type { CreateVerifyEmailBodyDto } from './dto/create-verify-email-body.dto';
import { emailVerificationExpiresAt } from './email-verification-expires-at';
import { passwordResetExpiresAt } from './password-reset-expires-at';
import { DEFAULT_PASSWORD_RESET_TTL_MS } from './password-reset-token.constants';
import { PasswordResetTokenService } from './password-reset-token.service';
import { DEFAULT_EMAIL_VERIFICATION_TTL_MS } from './email-verification-token.constants';
import { EmailVerificationTokenService } from './email-verification-token.service';
import type { User } from '../users/user.entity';
import { generateOpaqueToken } from './generate-opaque-token';
import { JwtAccessTokenService } from './jwt-access-token.service';
import { refreshExpiresAt } from './refresh-expires-at';
import { isRotatedReuse } from './refresh-token-reuse';
import { normalizeLockoutKey } from './login-lockout-state';
import { LoginLockoutService } from './login-lockout.service';
import { RefreshTokenService } from './refresh-token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserService,
    private readonly passwordHasher: PasswordHasherService,
    private readonly accessTokens: JwtAccessTokenService,
    private readonly refreshTokens: RefreshTokenService,
    private readonly emailVerificationTokens: EmailVerificationTokenService,
    private readonly passwordResetTokens: PasswordResetTokenService,
    private readonly config: ConfigService,
    private readonly loginLockout: LoginLockoutService,
    private readonly securityAudit: SecurityAuditService,
  ) {}

  async register(dto: CreateRegisterBodyDto): Promise<RegisterUserResponse> {
    const user = await this.users.create({
      email: dto.email,
      plainPassword: dto.password,
    });
    await this.recordAuthAudit({
      eventType: SecurityAuditEventType.AuthRegisterSuccess,
      actorUserId: user.id,
      subjectUserId: user.id,
    });
    const emailVerificationToken = await this.issueEmailVerificationForUser(
      user.id,
    );
    return this.toRegisterUserResponse(user, emailVerificationToken);
  }

  async requestPasswordReset(
    dto: CreateRequestPasswordResetBodyDto,
  ): Promise<RequestPasswordResetResponse> {
    const user = await this.users.findByEmail(dto.email);

    if (user === null) {
      return { message: PASSWORD_RESET_REQUEST_ACCEPTED_MESSAGE };
    }

    const passwordResetToken = await this.issuePasswordResetForUser(user.id);
    await this.recordAuthAudit({
      eventType: SecurityAuditEventType.AuthPasswordResetRequested,
      actorUserId: user.id,
      subjectUserId: user.id,
    });

    return {
      message: PASSWORD_RESET_REQUEST_ACCEPTED_MESSAGE,
      passwordResetToken,
    };
  }

  async resetPassword(
    dto: CreateResetPasswordBodyDto,
  ): Promise<ResetPasswordResponse> {
    const row = await this.passwordResetTokens.findActiveByRawToken(
      dto.passwordResetToken,
    );

    if (row === null) {
      throw new UnauthorizedException(INVALID_PASSWORD_RESET_TOKEN_MESSAGE);
    }

    await this.passwordResetTokens.consume(row.id);
    await this.users.updatePassword(row.userId, dto.password);
    await this.refreshTokens.revokeAllActiveForUser(row.userId);
    await this.passwordResetTokens.invalidateActiveForUser(row.userId);
    await this.recordAuthAudit({
      eventType: SecurityAuditEventType.AuthPasswordResetCompleted,
      actorUserId: row.userId,
      subjectUserId: row.userId,
    });

    return { message: PASSWORD_RESET_COMPLETED_MESSAGE };
  }

  async verifyEmail(
    dto: CreateVerifyEmailBodyDto,
  ): Promise<VerifyEmailResponse> {
    const row = await this.emailVerificationTokens.findActiveByRawToken(
      dto.emailVerificationToken,
    );

    if (row === null) {
      throw new UnauthorizedException(INVALID_EMAIL_VERIFICATION_TOKEN_MESSAGE);
    }

    await this.emailVerificationTokens.consume(row.id);
    const user = await this.users.markEmailVerified(row.userId);
    await this.recordAuthAudit({
      eventType: SecurityAuditEventType.AuthVerifyEmailSuccess,
      actorUserId: row.userId,
      subjectUserId: row.userId,
    });

    return {
      emailVerifiedAt: user.emailVerifiedAt!.toISOString(),
    };
  }

  async login(dto: CreateLoginBodyDto): Promise<LoginUserResponse> {
    this.loginLockout.assertNotLocked(dto.email);

    try {
      const user = await this.requireUserForCredentials(
        dto.email,
        dto.password,
      );
      this.loginLockout.clear(dto.email);
      const accessToken = await this.accessTokens.signForUser(user.id);
      const refreshToken = await this.issueRefreshForUser(user.id);
      await this.recordAuthAudit({
        eventType: SecurityAuditEventType.AuthLoginSuccess,
        actorUserId: user.id,
        subjectUserId: user.id,
      });

      return {
        ...this.toLoginUserResponse(user),
        accessToken,
        refreshToken,
      };
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === 429) {
        throw error;
      }

      if (error instanceof UnauthorizedException) {
        await this.recordAuthAudit({
          eventType: SecurityAuditEventType.AuthLoginFailure,
          metadata: { reason: 'invalid_credentials' },
        });
        if (this.loginLockout.recordFailure(dto.email)) {
          await this.recordAuthAudit({
            eventType: SecurityAuditEventType.AuthLockoutTriggered,
            metadata: { lockoutKey: normalizeLockoutKey(dto.email) },
          });
        }
      }

      throw error;
    }
  }

  async refresh(dto: CreateRefreshBodyDto): Promise<RefreshSessionResponse> {
    const existing = await this.refreshTokens.findActiveByRawToken(
      dto.refreshToken,
    );

    if (existing === null) {
      const row = await this.refreshTokens.findByRawToken(dto.refreshToken);

      if (row !== null && isRotatedReuse(row)) {
        await this.refreshTokens.revokeTokenFamily(row.id);
        await this.recordAuthAudit({
          eventType: SecurityAuditEventType.AuthRefreshReuseDetected,
          actorUserId: row.userId,
          subjectUserId: row.userId,
          metadata: { refreshTokenId: row.id },
        });
      }

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
    await this.recordAuthAudit({
      eventType: SecurityAuditEventType.AuthRefreshSuccess,
      actorUserId: existing.userId,
      subjectUserId: existing.userId,
    });

    return { accessToken, refreshToken: rawToken };
  }

  async logout(dto: CreateRefreshBodyDto): Promise<void> {
    const row = await this.refreshTokens.findByRawToken(dto.refreshToken);

    if (row !== null && row.revokedAt === null) {
      await this.refreshTokens.revoke(row.id);
      await this.recordAuthAudit({
        eventType: SecurityAuditEventType.AuthLogout,
        actorUserId: row.userId,
        subjectUserId: row.userId,
      });
    }
  }

  private async recordAuthAudit(input: {
    eventType: (typeof SecurityAuditEventType)[keyof typeof SecurityAuditEventType];
    actorUserId?: string | null;
    subjectUserId?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.securityAudit.record(input);
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

  private async issuePasswordResetForUser(userId: string): Promise<string> {
    await this.passwordResetTokens.invalidateActiveForUser(userId);
    const rawToken = generateOpaqueToken();
    await this.passwordResetTokens.persistForUser({
      userId,
      rawToken,
      expiresAt: passwordResetExpiresAt(
        Date.now(),
        DEFAULT_PASSWORD_RESET_TTL_MS,
      ),
    });
    return rawToken;
  }

  private async issueEmailVerificationForUser(userId: string): Promise<string> {
    const rawToken = generateOpaqueToken();
    await this.emailVerificationTokens.persistForUser({
      userId,
      rawToken,
      expiresAt: emailVerificationExpiresAt(
        Date.now(),
        DEFAULT_EMAIL_VERIFICATION_TTL_MS,
      ),
    });
    return rawToken;
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
    const ttlMs = this.config.getOrThrow<number>('JWT_REFRESH_EXPIRES_MS');
    return refreshExpiresAt(Date.now(), ttlMs);
  }

  private toRegisterUserResponse(
    user: User,
    emailVerificationToken: string,
  ): RegisterUserResponse {
    return {
      id: user.id,
      email: user.email,
      emailVerificationToken,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private toLoginUserResponse(
    user: User,
  ): Pick<LoginUserResponse, 'id' | 'email' | 'createdAt' | 'updatedAt'> {
    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
