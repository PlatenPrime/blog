import {
  API_ERROR_CODE_VALIDATION,
  PROBLEM_MEDIA_TYPE,
  type ProblemDetailsBody,
  type RequestPasswordResetResponse,
  problemTypeUriForCode,
} from '@blog/shared-contracts';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module';
import { PASSWORD_RESET_REQUEST_ACCEPTED_MESSAGE } from '../src/auth/auth-credentials.constants';
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

const fakeUser: User = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'user@example.com',
  passwordHash: 'argon2id$v=19$m=65536,t=3,p=4$hash',
  emailVerifiedAt: null,
  createdAt: new Date('2026-05-20T10:00:00.000Z'),
  updatedAt: new Date('2026-05-20T10:00:00.000Z'),
};

describe('Auth request-password-reset (e2e)', () => {
  let app: INestApplication<App>;
  let findByEmail: ReturnType<typeof vi.fn>;
  let invalidateActiveForUser: ReturnType<typeof vi.fn>;
  let persistForUser: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    findByEmail = vi.fn();
    invalidateActiveForUser = vi.fn();
    persistForUser = vi.fn();

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
      })
      .overrideProvider(PasswordResetTokenService)
      .useValue({
        invalidateActiveForUser,
        persistForUser,
        findByRawToken: vi.fn(),
        findActiveByRawToken: vi.fn(),
        consume: vi.fn(),
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

  it('returns VALIDATION_FAILED for an invalid request-password-reset body', async () => {
    const response = await request(app.getHttpServer())
      .post(requestPasswordResetBase)
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

    const emailDetail = body.details?.find(
      (detail) => detail.field === 'email',
    );
    expect(emailDetail).toBeDefined();
    expect(emailDetail?.message.length).toBeGreaterThan(0);
  });

  it('rejects non-whitelisted properties on request-password-reset with 400', async () => {
    const response = await request(app.getHttpServer())
      .post(requestPasswordResetBase)
      .send({
        email: fakeUser.email,
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

  it('returns RequestPasswordResetResponse with token when user exists', async () => {
    findByEmail.mockResolvedValue(fakeUser);
    persistForUser.mockResolvedValue({ id: 'prt-1' });

    const response = await request(app.getHttpServer())
      .post(requestPasswordResetBase)
      .send({ email: fakeUser.email })
      .expect(200);

    const body = response.body as RequestPasswordResetResponse;

    expect(body.message).toBe(PASSWORD_RESET_REQUEST_ACCEPTED_MESSAGE);
    expect(typeof body.passwordResetToken).toBe('string');
    expect(body.passwordResetToken!.length).toBeGreaterThan(0);
    expect(findByEmail).toHaveBeenCalledWith(fakeUser.email);
    expect(invalidateActiveForUser).toHaveBeenCalledWith(fakeUser.id);
    expect(persistForUser).toHaveBeenCalledOnce();
    const persistArgs = persistForUser.mock.calls[0]?.[0] as {
      userId: string;
      rawToken: string;
      expiresAt: Date;
    };
    expect(persistArgs.userId).toBe(fakeUser.id);
    expect(persistArgs.rawToken).toBe(body.passwordResetToken);
    expect(persistArgs.expiresAt).toBeInstanceOf(Date);
  });

  it('returns neutral message without persisting when email is unknown', async () => {
    findByEmail.mockResolvedValue(null);

    const response = await request(app.getHttpServer())
      .post(requestPasswordResetBase)
      .send({ email: 'missing@example.com' })
      .expect(200);

    const body = response.body as RequestPasswordResetResponse;

    expect(body).toEqual({
      message: PASSWORD_RESET_REQUEST_ACCEPTED_MESSAGE,
    });
    expect(findByEmail).toHaveBeenCalledWith('missing@example.com');
    expect(invalidateActiveForUser).not.toHaveBeenCalled();
    expect(persistForUser).not.toHaveBeenCalled();
  });
});
