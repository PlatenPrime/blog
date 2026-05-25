import {
  API_ERROR_CODE_FORBIDDEN,
  API_ERROR_CODE_TOO_MANY_REQUESTS,
  API_ERROR_CODE_UNAUTHORIZED,
  API_ERROR_CODE_VALIDATION,
} from '@blog/shared-contracts';
import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  INestApplication,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { AppModule } from '../app.module';
import {
  EMAIL_NOT_VERIFIED_MESSAGE,
  INVALID_LOGIN_CREDENTIALS_MESSAGE,
  INVALID_REFRESH_TOKEN_MESSAGE,
} from '../auth/auth-credentials.constants';
import { INVALID_ACCESS_TOKEN_MESSAGE } from '../auth/auth-jwt.constants';
import { EmailVerifiedPolicyService } from '../auth/email-verified-policy.service';
import { EmailVerificationTokenService } from '../auth/email-verification-token.service';
import { LoginLockoutService } from '../auth/login-lockout.service';
import { LOGIN_LOCKOUT_MESSAGE } from '../auth/login-lockout.constants';
import { PasswordResetTokenService } from '../auth/password-reset-token.service';
import { RefreshTokenService } from '../auth/refresh-token.service';
import { API_V1_BASE } from '../config/configure-api-http';
import { configureApiHttp } from '../config/configure-api-http';
import { configureApiShutdown } from '../config/configure-api-shutdown';
import { enableApiCors } from '../config/enable-api-cors';
import { EmailService } from '../email/email.service';
import { PostgresHealthIndicator } from '../health/indicators/postgres.health-indicator';
import { SecurityAuditService } from '../security-audit';
import { createTestDataSourceStub } from '../testing/create-test-data-source.stub';
import { expectProblemDetailsContract } from '../testing/expect-problem-details-contract';
import type { User } from '../users/user.entity';
import { PasswordHasherService } from '../users/password-hasher.service';
import { UserService } from '../users/user.service';

const AUTH_BASE = `${API_V1_BASE}/auth`;

const fakeUser: User = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'user@example.com',
  passwordHash: 'argon2id$v=19$m=65536,t=3,p=4$hash',
  emailVerifiedAt: null,
  createdAt: new Date('2026-05-20T10:00:00.000Z'),
  updatedAt: new Date('2026-05-20T10:00:00.000Z'),
};

describe('Auth error Problem Details contract', () => {
  let app: INestApplication<App>;
  let findByEmail: ReturnType<typeof vi.fn>;
  let passwordMatches: ReturnType<typeof vi.fn>;
  let refreshFindActiveByRawToken: ReturnType<typeof vi.fn>;
  let refreshFindByRawToken: ReturnType<typeof vi.fn>;
  let assertNotLocked: ReturnType<typeof vi.fn>;
  let recordFailure: ReturnType<typeof vi.fn>;
  let assertUserMayAuthenticate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    findByEmail = vi.fn();
    passwordMatches = vi.fn();
    refreshFindActiveByRawToken = vi.fn();
    refreshFindByRawToken = vi.fn();
    assertNotLocked = vi.fn();
    recordFailure = vi.fn().mockReturnValue(false);
    assertUserMayAuthenticate = vi.fn();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PostgresHealthIndicator)
      .useValue({
        isHealthy: () => Promise.resolve({ database: { status: 'up' } }),
      })
      .overrideProvider(DataSource)
      .useValue(createTestDataSourceStub())
      .overrideProvider(UserService)
      .useValue({
        create: vi.fn(),
        findByEmail,
        findById: vi.fn(),
        markEmailVerified: vi.fn(),
        updatePassword: vi.fn(),
      })
      .overrideProvider(PasswordHasherService)
      .useValue({ hash: vi.fn(), verify: passwordMatches })
      .overrideProvider(RefreshTokenService)
      .useValue({
        persistForUser: vi.fn(),
        findActiveByRawToken: refreshFindActiveByRawToken,
        findByRawToken: refreshFindByRawToken,
        markReplaced: vi.fn(),
        revoke: vi.fn(),
        revokeAllActiveForUser: vi.fn(),
        revokeTokenFamily: vi.fn(),
      })
      .overrideProvider(EmailVerificationTokenService)
      .useValue({
        invalidateActiveForUser: vi.fn(),
        persistForUser: vi.fn(),
        findByRawToken: vi.fn(),
        findActiveByRawToken: vi.fn(),
        consume: vi.fn(),
      })
      .overrideProvider(PasswordResetTokenService)
      .useValue({
        invalidateActiveForUser: vi.fn(),
        persistForUser: vi.fn(),
        findByRawToken: vi.fn(),
        findActiveByRawToken: vi.fn(),
        consume: vi.fn(),
      })
      .overrideProvider(LoginLockoutService)
      .useValue({
        assertNotLocked,
        recordFailure,
        clear: vi.fn(),
      })
      .overrideProvider(EmailVerifiedPolicyService)
      .useValue({
        isRequired: vi.fn().mockReturnValue(false),
        assertUserMayAuthenticate,
      })
      .overrideProvider(SecurityAuditService)
      .useValue({ record: vi.fn() })
      .overrideProvider(EmailService)
      .useValue({
        isEnabled: vi.fn().mockReturnValue(false),
        sendVerificationEmail: vi.fn(),
        sendPasswordResetEmail: vi.fn(),
        logSendFailure: vi.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    enableApiCors(app);
    configureApiHttp(app);
    configureApiShutdown(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('maps invalid login DTO to VALIDATION_FAILED problem details', async () => {
    const response = await request(app.getHttpServer())
      .post(`${AUTH_BASE}/login`)
      .send({})
      .expect(400);

    expectProblemDetailsContract(response, {
      status: 400,
      code: API_ERROR_CODE_VALIDATION,
      detail: 'Validation failed',
      expectDetails: true,
    });
  });

  it('maps invalid login credentials to UNAUTHORIZED problem details', async () => {
    findByEmail.mockResolvedValue(null);

    const response = await request(app.getHttpServer())
      .post(`${AUTH_BASE}/login`)
      .send({ email: 'missing@example.com', password: 'secret123' })
      .expect(401);

    expectProblemDetailsContract(response, {
      status: 401,
      code: API_ERROR_CODE_UNAUTHORIZED,
      detail: INVALID_LOGIN_CREDENTIALS_MESSAGE,
      expectDetails: false,
    });
  });

  it('maps missing access token to UNAUTHORIZED problem details', async () => {
    const response = await request(app.getHttpServer())
      .get(`${AUTH_BASE}/me`)
      .expect(401);

    expectProblemDetailsContract(response, {
      status: 401,
      code: API_ERROR_CODE_UNAUTHORIZED,
      detail: INVALID_ACCESS_TOKEN_MESSAGE,
      expectDetails: false,
    });
  });

  it('maps invalid refresh token to UNAUTHORIZED problem details', async () => {
    refreshFindActiveByRawToken.mockResolvedValue(null);
    refreshFindByRawToken.mockResolvedValue(null);

    const response = await request(app.getHttpServer())
      .post(`${AUTH_BASE}/refresh`)
      .send({ refreshToken: 'not-active-refresh-token' })
      .expect(401);

    expectProblemDetailsContract(response, {
      status: 401,
      code: API_ERROR_CODE_UNAUTHORIZED,
      detail: INVALID_REFRESH_TOKEN_MESSAGE,
      expectDetails: false,
    });
  });

  it('maps verified-email policy failures to FORBIDDEN problem details', async () => {
    findByEmail.mockResolvedValue(fakeUser);
    passwordMatches.mockResolvedValue(true);
    assertUserMayAuthenticate.mockImplementation(() => {
      throw new ForbiddenException(EMAIL_NOT_VERIFIED_MESSAGE);
    });

    const response = await request(app.getHttpServer())
      .post(`${AUTH_BASE}/login`)
      .send({ email: 'user@example.com', password: 'secret123' })
      .expect(403);

    expectProblemDetailsContract(response, {
      status: 403,
      code: API_ERROR_CODE_FORBIDDEN,
      detail: EMAIL_NOT_VERIFIED_MESSAGE,
      expectDetails: false,
    });
  });

  it('maps login lockout to TOO_MANY_REQUESTS problem details', async () => {
    assertNotLocked.mockImplementation(() => {
      throw new HttpException(
        LOGIN_LOCKOUT_MESSAGE,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    });

    const response = await request(app.getHttpServer())
      .post(`${AUTH_BASE}/login`)
      .send({ email: 'locked@example.com', password: 'secret123' })
      .expect(429);

    expectProblemDetailsContract(response, {
      status: 429,
      code: API_ERROR_CODE_TOO_MANY_REQUESTS,
      detail: LOGIN_LOCKOUT_MESSAGE,
      expectDetails: false,
    });
  });
});
