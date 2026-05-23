import {
  API_ERROR_CODE_TOO_MANY_REQUESTS,
  PROBLEM_MEDIA_TYPE,
  type ProblemDetailsBody,
  type RequestPasswordResetResponse,
  type ResendVerificationResponse,
  problemTypeUriForCode,
} from '@blog/shared-contracts';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module';
import { AUTH_SENSITIVE_RATE_LIMIT_MESSAGE } from '../src/auth/auth-sensitive-rate-limit.constants';
import { AuthSensitiveRateLimitService } from '../src/auth/auth-sensitive-rate-limit.service';
import {
  PASSWORD_RESET_REQUEST_ACCEPTED_MESSAGE,
  RESEND_VERIFICATION_ACCEPTED_MESSAGE,
} from '../src/auth/auth-credentials.constants';
import { EmailVerificationTokenService } from '../src/auth/email-verification-token.service';
import { PasswordResetTokenService } from '../src/auth/password-reset-token.service';
import { API_V1_BASE } from '../src/config/configure-api-http';
import { configureApiHttp } from '../src/config/configure-api-http';
import { configureApiShutdown } from '../src/config/configure-api-shutdown';
import { enableApiCors } from '../src/config/enable-api-cors';
import { PostgresHealthIndicator } from '../src/health/indicators/postgres.health-indicator';
import { createTestDataSourceStub } from '../src/testing/create-test-data-source.stub';
import type { User } from '../src/users/user.entity';
import { UserService } from '../src/users/user.service';

const requestPasswordResetBase = `${API_V1_BASE}/auth/request-password-reset`;
const resendVerificationBase = `${API_V1_BASE}/auth/resend-verification`;

const fakeUser: User = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'user@example.com',
  passwordHash: 'argon2id$v=19$m=65536,t=3,p=4$hash',
  emailVerifiedAt: null,
  createdAt: new Date('2026-05-20T10:00:00.000Z'),
  updatedAt: new Date('2026-05-20T10:00:00.000Z'),
};

const e2eRateLimitConfig = {
  getOrThrow: (key: string) => {
    if (key === 'AUTH_SENSITIVE_RATE_MAX_ATTEMPTS') {
      return 2;
    }
    if (key === 'AUTH_SENSITIVE_RATE_WINDOW_MS') {
      return 60_000;
    }
    if (key === 'AUTH_SENSITIVE_RATE_DURATION_MS') {
      return 120_000;
    }
    throw new Error(`unexpected config key in e2e rate limit: ${key}`);
  },
} as unknown as ConfigService;

describe('Auth sensitive rate limits (e2e)', () => {
  let app: INestApplication<App>;
  let findByEmail: ReturnType<typeof vi.fn>;
  let sensitiveRateLimit: AuthSensitiveRateLimitService;

  beforeEach(async () => {
    findByEmail = vi.fn();
    sensitiveRateLimit = new AuthSensitiveRateLimitService(e2eRateLimitConfig);

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
        markEmailVerified: vi.fn(),
        updatePassword: vi.fn(),
      })
      .overrideProvider(PasswordResetTokenService)
      .useValue({
        invalidateActiveForUser: vi.fn(),
        persistForUser: vi.fn(),
        findByRawToken: vi.fn(),
        findActiveByRawToken: vi.fn(),
        consume: vi.fn(),
      })
      .overrideProvider(EmailVerificationTokenService)
      .useValue({
        invalidateActiveForUser: vi.fn(),
        persistForUser: vi.fn(),
        findByRawToken: vi.fn(),
        findActiveByRawToken: vi.fn(),
        consume: vi.fn(),
      })
      .overrideProvider(AuthSensitiveRateLimitService)
      .useValue(sensitiveRateLimit)
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

  it('returns 200 below rate limit threshold on password reset', async () => {
    findByEmail.mockResolvedValue(null);

    const response = await request(app.getHttpServer())
      .post(requestPasswordResetBase)
      .send({ email: 'user@example.com' })
      .expect(200);

    const body = response.body as RequestPasswordResetResponse;
    expect(body.message).toBe(PASSWORD_RESET_REQUEST_ACCEPTED_MESSAGE);
  });

  it('returns 429 TOO_MANY_REQUESTS on password reset after max attempts for email', async () => {
    findByEmail.mockResolvedValue(null);

    await request(app.getHttpServer())
      .post(requestPasswordResetBase)
      .send({ email: 'locked@example.com' })
      .expect(200);
    await request(app.getHttpServer())
      .post(requestPasswordResetBase)
      .send({ email: 'locked@example.com' })
      .expect(200);

    const blocked = await request(app.getHttpServer())
      .post(requestPasswordResetBase)
      .send({ email: 'locked@example.com' })
      .expect(429);

    const problem = blocked.body as ProblemDetailsBody;
    expect(problem).toMatchObject({
      type: problemTypeUriForCode(API_ERROR_CODE_TOO_MANY_REQUESTS),
      detail: AUTH_SENSITIVE_RATE_LIMIT_MESSAGE,
      status: 429,
      title: 'Too Many Requests',
      code: API_ERROR_CODE_TOO_MANY_REQUESTS,
    });
    expect(blocked.headers['content-type']).toContain(PROBLEM_MEDIA_TYPE);
  });

  it('returns 429 on password reset when IP bucket is locked across emails', async () => {
    findByEmail.mockResolvedValue(null);
    const ip = '203.0.113.50';

    await request(app.getHttpServer())
      .post(requestPasswordResetBase)
      .set('X-Forwarded-For', ip)
      .send({ email: 'a@example.com' })
      .expect(200);
    await request(app.getHttpServer())
      .post(requestPasswordResetBase)
      .set('X-Forwarded-For', ip)
      .send({ email: 'b@example.com' })
      .expect(200);

    const blocked = await request(app.getHttpServer())
      .post(requestPasswordResetBase)
      .set('X-Forwarded-For', ip)
      .send({ email: 'c@example.com' })
      .expect(429);

    expect((blocked.body as ProblemDetailsBody).code).toBe(
      API_ERROR_CODE_TOO_MANY_REQUESTS,
    );
  });

  it('keeps separate buckets for password reset and resend verification', async () => {
    findByEmail.mockResolvedValue(fakeUser);

    await request(app.getHttpServer())
      .post(requestPasswordResetBase)
      .send({ email: 'user@example.com' })
      .expect(200);
    await request(app.getHttpServer())
      .post(requestPasswordResetBase)
      .send({ email: 'user@example.com' })
      .expect(200);

    const resend = await request(app.getHttpServer())
      .post(resendVerificationBase)
      .send({ email: 'user@example.com' })
      .expect(200);

    const body = resend.body as ResendVerificationResponse;
    expect(body.message).toBe(RESEND_VERIFICATION_ACCEPTED_MESSAGE);
  });

  it('returns 429 on resend verification after max attempts', async () => {
    findByEmail.mockResolvedValue(null);

    await request(app.getHttpServer())
      .post(resendVerificationBase)
      .send({ email: 'resend@example.com' })
      .expect(200);
    await request(app.getHttpServer())
      .post(resendVerificationBase)
      .send({ email: 'resend@example.com' })
      .expect(200);

    await request(app.getHttpServer())
      .post(resendVerificationBase)
      .send({ email: 'resend@example.com' })
      .expect(429);
  });
});
