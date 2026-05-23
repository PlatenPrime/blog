import {
  API_ERROR_CODE_UNAUTHORIZED,
  API_ERROR_CODE_VALIDATION,
  PROBLEM_MEDIA_TYPE,
  type ProblemDetailsBody,
  type VerifyEmailResponse,
  problemTypeUriForCode,
} from '@blog/shared-contracts';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module';
import { INVALID_EMAIL_VERIFICATION_TOKEN_MESSAGE } from '../src/auth/auth-credentials.constants';
import type { EmailVerificationToken } from '../src/auth/email-verification-token.entity';
import { EmailVerificationTokenService } from '../src/auth/email-verification-token.service';
import { API_V1_BASE } from '../src/config/configure-api-http';
import { configureApiHttp } from '../src/config/configure-api-http';
import { configureApiShutdown } from '../src/config/configure-api-shutdown';
import { enableApiCors } from '../src/config/enable-api-cors';
import { PostgresHealthIndicator } from '../src/health/indicators/postgres.health-indicator';
import { createTestDataSourceStub } from '../src/testing/create-test-data-source.stub';
import type { User } from '../src/users/user.entity';
import { UserService } from '../src/users/user.service';

const verifyEmailBase = `${API_V1_BASE}/auth/verify-email`;

const activeEmailVerificationToken = 'opaque-email-verification-secret';

const fakeUser: User = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'user@example.com',
  passwordHash: 'argon2id$v=19$m=65536,t=3,p=4$hash',
  emailVerifiedAt: null,
  createdAt: new Date('2026-05-20T10:00:00.000Z'),
  updatedAt: new Date('2026-05-20T10:00:00.000Z'),
};

describe('Auth verify-email (e2e)', () => {
  let app: INestApplication<App>;
  let findActiveByRawToken: ReturnType<typeof vi.fn>;
  let consume: ReturnType<typeof vi.fn>;
  let markEmailVerified: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    findActiveByRawToken = vi.fn();
    consume = vi.fn();
    markEmailVerified = vi.fn();

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
        findByEmail: vi.fn(),
        markEmailVerified,
      })
      .overrideProvider(EmailVerificationTokenService)
      .useValue({
        invalidateActiveForUser: vi.fn(),
        persistForUser: vi.fn(),
        findActiveByRawToken,
        findByRawToken: vi.fn(),
        consume,
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

  it('returns VALIDATION_FAILED for an invalid verify-email body', async () => {
    const response = await request(app.getHttpServer())
      .post(verifyEmailBase)
      .send({})
      .expect(400);

    expect(response.headers['content-type']).toContain(PROBLEM_MEDIA_TYPE);

    const body = response.body as ProblemDetailsBody;

    expect(body).toMatchObject({
      type: problemTypeUriForCode(API_ERROR_CODE_VALIDATION),
      title: 'Validation Failed',
      status: 400,
      detail: 'Validation failed',
      code: API_ERROR_CODE_VALIDATION,
    });

    const tokenDetail = body.details?.find(
      (detail) => detail.field === 'emailVerificationToken',
    );
    expect(tokenDetail).toBeDefined();
    expect(tokenDetail?.message.length).toBeGreaterThan(0);
  });

  it('rejects non-whitelisted properties on verify-email with 400', async () => {
    const response = await request(app.getHttpServer())
      .post(verifyEmailBase)
      .send({
        emailVerificationToken: activeEmailVerificationToken,
        extra: 'x',
      })
      .expect(400);

    const body = response.body as ProblemDetailsBody;

    expect(body).toMatchObject({
      code: API_ERROR_CODE_VALIDATION,
      detail: 'Validation failed',
      status: 400,
    });
    const extraDetail = body.details?.find(
      (detail) => detail.field === 'extra',
    );
    expect(extraDetail).toBeDefined();
    expect(extraDetail?.message).toContain('extra');
  });

  it('returns VerifyEmailResponse when email verification token is active', async () => {
    const verifiedAt = new Date('2026-05-21T12:00:00.000Z');
    const row = {
      id: 'evt-1',
      userId: fakeUser.id,
    } as EmailVerificationToken;
    findActiveByRawToken.mockResolvedValue(row);
    markEmailVerified.mockResolvedValue({
      ...fakeUser,
      emailVerifiedAt: verifiedAt,
    });

    const response = await request(app.getHttpServer())
      .post(verifyEmailBase)
      .send({ emailVerificationToken: activeEmailVerificationToken })
      .expect(200);

    const body = response.body as VerifyEmailResponse;

    expect(body).toEqual({
      emailVerifiedAt: verifiedAt.toISOString(),
    });
    expect(findActiveByRawToken).toHaveBeenCalledWith(
      activeEmailVerificationToken,
    );
    expect(consume).toHaveBeenCalledWith('evt-1');
    expect(markEmailVerified).toHaveBeenCalledWith(fakeUser.id);
  });

  it('returns UNAUTHORIZED when email verification token is not active', async () => {
    findActiveByRawToken.mockResolvedValue(null);

    const response = await request(app.getHttpServer())
      .post(verifyEmailBase)
      .send({ emailVerificationToken: activeEmailVerificationToken })
      .expect(401);

    expect(response.headers['content-type']).toContain(PROBLEM_MEDIA_TYPE);

    const body = response.body as ProblemDetailsBody;

    expect(body).toMatchObject({
      type: problemTypeUriForCode(API_ERROR_CODE_UNAUTHORIZED),
      title: 'Unauthorized',
      status: 401,
      detail: INVALID_EMAIL_VERIFICATION_TOKEN_MESSAGE,
      code: API_ERROR_CODE_UNAUTHORIZED,
    });
    expect(consume).not.toHaveBeenCalled();
    expect(markEmailVerified).not.toHaveBeenCalled();
  });
});
