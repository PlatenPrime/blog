import {
  API_ERROR_CODE_FORBIDDEN,
  PROBLEM_MEDIA_TYPE,
  type AuthMeResponse,
  type LoginUserResponse,
  type ProblemDetailsBody,
  problemTypeUriForCode,
} from '@blog/shared-contracts';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module';
import { EMAIL_NOT_VERIFIED_MESSAGE } from '../src/auth/auth-credentials.constants';
import { EmailVerifiedPolicyService } from '../src/auth/email-verified-policy.service';
import { JwtAccessTokenService } from '../src/auth/jwt-access-token.service';
import { RefreshTokenService } from '../src/auth/refresh-token.service';
import { API_V1_BASE } from '../src/config/configure-api-http';
import { configureApiHttp } from '../src/config/configure-api-http';
import { configureApiShutdown } from '../src/config/configure-api-shutdown';
import { enableApiCors } from '../src/config/enable-api-cors';
import { PostgresHealthIndicator } from '../src/health/indicators/postgres.health-indicator';
import { createTestDataSourceStub } from '../src/testing/create-test-data-source.stub';
import type { User } from '../src/users/user.entity';
import { PasswordHasherService } from '../src/users/password-hasher.service';
import { UserService } from '../src/users/user.service';
import {
  createDisabledEmailVerifiedPolicyOverride,
  createStrictEmailVerifiedPolicyOverride,
} from './helpers/auth-e2e-email-verified-policy';

const loginBase = `${API_V1_BASE}/auth/login`;
const refreshBase = `${API_V1_BASE}/auth/refresh`;
const meBase = `${API_V1_BASE}/auth/me`;

const userId = '11111111-1111-4111-8111-111111111111';

const unverifiedUser: User = {
  id: userId,
  email: 'user@example.com',
  passwordHash: 'argon2id$v=19$m=65536,t=3,p=4$hash',
  emailVerifiedAt: null,
  createdAt: new Date('2026-05-20T10:00:00.000Z'),
  updatedAt: new Date('2026-05-20T10:00:00.000Z'),
};

const verifiedUser: User = {
  ...unverifiedUser,
  emailVerifiedAt: new Date('2026-05-21T00:00:00.000Z'),
};

function createTestModule(policy: 'strict' | 'disabled') {
  const findByEmail = vi.fn();
  const findById = vi.fn();
  const verify = vi.fn();
  const persistForUser = vi.fn().mockResolvedValue({ id: 'rt-1' });
  const findActiveByRawToken = vi.fn();

  const policyOverride =
    policy === 'strict'
      ? createStrictEmailVerifiedPolicyOverride()
      : createDisabledEmailVerifiedPolicyOverride();

  return {
    findByEmail,
    findById,
    verify,
    persistForUser,
    findActiveByRawToken,
    moduleFactory: Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailVerifiedPolicyService)
      .useValue(policyOverride)
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
        findById,
        markEmailVerified: vi.fn(),
        updatePassword: vi.fn(),
      })
      .overrideProvider(PasswordHasherService)
      .useValue({ hash: vi.fn(), verify })
      .overrideProvider(RefreshTokenService)
      .useValue({
        persistForUser,
        findActiveByRawToken,
        markReplaced: vi.fn(),
        revoke: vi.fn(),
        findByRawToken: vi.fn(),
        revokeAllActiveForUser: vi.fn(),
        revokeTokenFamily: vi.fn(),
      }),
  };
}

describe('REQUIRE_EMAIL_VERIFIED policy (e2e)', () => {
  describe('when policy is enabled', () => {
    let app: INestApplication<App>;
    let findByEmail: ReturnType<typeof vi.fn>;
    let findById: ReturnType<typeof vi.fn>;
    let verify: ReturnType<typeof vi.fn>;
    let findActiveByRawToken: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      const mocks = createTestModule('strict');
      findByEmail = mocks.findByEmail;
      findById = mocks.findById;
      verify = mocks.verify;
      findActiveByRawToken = mocks.findActiveByRawToken;

      const moduleFixture: TestingModule = await mocks.moduleFactory.compile();

      app = moduleFixture.createNestApplication();
      enableApiCors(app);
      configureApiHttp(app);
      configureApiShutdown(app);
      await app.init();
    });

    afterEach(async () => {
      await app.close();
    });

    it('returns FORBIDDEN on login when email is not verified', async () => {
      findByEmail.mockResolvedValue(unverifiedUser);
      verify.mockResolvedValue(true);

      const response = await request(app.getHttpServer())
        .post(loginBase)
        .send({ email: 'user@example.com', password: 'secret123' })
        .expect(403);

      expect(response.headers['content-type']).toContain(PROBLEM_MEDIA_TYPE);

      const body = response.body as ProblemDetailsBody;

      expect(body).toMatchObject({
        type: problemTypeUriForCode(API_ERROR_CODE_FORBIDDEN),
        title: 'Forbidden',
        status: 403,
        detail: EMAIL_NOT_VERIFIED_MESSAGE,
        code: API_ERROR_CODE_FORBIDDEN,
      });
    });

    it('returns LoginUserResponse on login when email is verified', async () => {
      findByEmail.mockResolvedValue(verifiedUser);
      verify.mockResolvedValue(true);

      const response = await request(app.getHttpServer())
        .post(loginBase)
        .send({ email: 'user@example.com', password: 'secret123' })
        .expect(200);

      const body = response.body as LoginUserResponse;

      expect(body.id).toBe(verifiedUser.id);
      expect(typeof body.accessToken).toBe('string');
    });

    it('returns FORBIDDEN on refresh when email is not verified', async () => {
      findActiveByRawToken.mockResolvedValue({
        id: 'rt-old',
        userId,
      });
      findById.mockResolvedValue(unverifiedUser);

      const response = await request(app.getHttpServer())
        .post(refreshBase)
        .send({ refreshToken: 'opaque-refresh-token' })
        .expect(403);

      const body = response.body as ProblemDetailsBody;

      expect(body).toMatchObject({
        code: API_ERROR_CODE_FORBIDDEN,
        status: 403,
        detail: EMAIL_NOT_VERIFIED_MESSAGE,
      });
    });

    it('returns FORBIDDEN on GET /auth/me when JWT is valid but email is not verified', async () => {
      findById.mockResolvedValue(unverifiedUser);
      const accessTokens = app.get(JwtAccessTokenService);
      const accessToken = await accessTokens.signForUser(userId);

      const response = await request(app.getHttpServer())
        .get(meBase)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);

      const body = response.body as ProblemDetailsBody;

      expect(body).toMatchObject({
        code: API_ERROR_CODE_FORBIDDEN,
        status: 403,
        detail: EMAIL_NOT_VERIFIED_MESSAGE,
      });
    });

    it('returns AuthMeResponse when email is verified', async () => {
      findById.mockResolvedValue(verifiedUser);
      const accessTokens = app.get(JwtAccessTokenService);
      const accessToken = await accessTokens.signForUser(userId);

      const response = await request(app.getHttpServer())
        .get(meBase)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = response.body as AuthMeResponse;

      expect(body).toEqual({ id: userId });
    });
  });

  describe('when policy is disabled (default)', () => {
    let app: INestApplication<App>;
    let findByEmail: ReturnType<typeof vi.fn>;
    let verify: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      const mocks = createTestModule('disabled');
      findByEmail = mocks.findByEmail;
      verify = mocks.verify;

      const moduleFixture: TestingModule = await mocks.moduleFactory.compile();

      app = moduleFixture.createNestApplication();
      enableApiCors(app);
      configureApiHttp(app);
      configureApiShutdown(app);
      await app.init();
    });

    afterEach(async () => {
      await app.close();
    });

    it('allows login for unverified user', async () => {
      findByEmail.mockResolvedValue(unverifiedUser);
      verify.mockResolvedValue(true);

      const response = await request(app.getHttpServer())
        .post(loginBase)
        .send({ email: 'user@example.com', password: 'secret123' })
        .expect(200);

      const body = response.body as LoginUserResponse;

      expect(body.id).toBe(unverifiedUser.id);
      expect(typeof body.accessToken).toBe('string');
    });
  });
});
