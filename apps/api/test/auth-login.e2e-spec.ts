import {
  API_ERROR_CODE_UNAUTHORIZED,
  API_ERROR_CODE_VALIDATION,
  PROBLEM_MEDIA_TYPE,
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
import { INVALID_LOGIN_CREDENTIALS_MESSAGE } from '../src/auth/auth-credentials.constants';
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

const loginBase = `${API_V1_BASE}/auth/login`;

const fakeUser: User = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'user@example.com',
  passwordHash: 'argon2id$v=19$m=65536,t=3,p=4$hash',
  emailVerifiedAt: null,
  createdAt: new Date('2026-05-20T10:00:00.000Z'),
  updatedAt: new Date('2026-05-20T10:00:00.000Z'),
};

describe('Auth login (e2e)', () => {
  let app: INestApplication<App>;
  let findByEmail: ReturnType<typeof vi.fn>;
  let verify: ReturnType<typeof vi.fn>;
  let persistForUser: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    findByEmail = vi.fn();
    verify = vi.fn();
    persistForUser = vi.fn().mockResolvedValue({ id: 'rt-1' });

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
      .useValue({ create: vi.fn(), findByEmail })
      .overrideProvider(PasswordHasherService)
      .useValue({ hash: vi.fn(), verify })
      .overrideProvider(RefreshTokenService)
      .useValue({
        persistForUser,
        findActiveByRawToken: vi.fn(),
        markReplaced: vi.fn(),
        revoke: vi.fn(),
        findByRawToken: vi.fn(),
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

  it('returns VALIDATION_FAILED with details for an invalid login body', async () => {
    const response = await request(app.getHttpServer())
      .post(loginBase)
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
    const passwordDetail = body.details?.find(
      (detail) => detail.field === 'password',
    );
    expect(emailDetail).toBeDefined();
    expect(emailDetail?.message.length).toBeGreaterThan(0);
    expect(passwordDetail).toBeDefined();
    expect(passwordDetail?.message.length).toBeGreaterThan(0);
  });

  it('rejects non-whitelisted properties on login with 400', async () => {
    const response = await request(app.getHttpServer())
      .post(loginBase)
      .send({
        email: 'user@example.com',
        password: 'secret123',
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

  it('returns LoginUserResponse when credentials are valid', async () => {
    findByEmail.mockResolvedValue(fakeUser);
    verify.mockResolvedValue(true);

    const response = await request(app.getHttpServer())
      .post(loginBase)
      .send({ email: 'user@example.com', password: 'secret123' })
      .expect(200);

    const body = response.body as LoginUserResponse & {
      passwordHash?: string;
    };

    expect(body.id).toBe(fakeUser.id);
    expect(body.email).toBe(fakeUser.email);
    expect(body.createdAt).toBe(fakeUser.createdAt.toISOString());
    expect(body.updatedAt).toBe(fakeUser.updatedAt.toISOString());
    expect(typeof body.accessToken).toBe('string');
    expect(body.accessToken.length).toBeGreaterThan(0);
    expect(typeof body.refreshToken).toBe('string');
    expect(body.refreshToken.length).toBeGreaterThan(0);
    expect(body).not.toHaveProperty('passwordHash');

    expect(findByEmail).toHaveBeenCalledWith('user@example.com');
    expect(verify).toHaveBeenCalledWith('secret123', fakeUser.passwordHash);
    expect(persistForUser).toHaveBeenCalledOnce();
  });

  it('returns UNAUTHORIZED when user is not found', async () => {
    findByEmail.mockResolvedValue(null);

    const response = await request(app.getHttpServer())
      .post(loginBase)
      .send({ email: 'missing@example.com', password: 'secret123' })
      .expect(401);

    expect(response.headers['content-type']).toContain(PROBLEM_MEDIA_TYPE);

    const body = response.body as ProblemDetailsBody;

    expect(body).toMatchObject({
      type: problemTypeUriForCode(API_ERROR_CODE_UNAUTHORIZED),
      title: 'Unauthorized',
      status: 401,
      detail: INVALID_LOGIN_CREDENTIALS_MESSAGE,
      code: API_ERROR_CODE_UNAUTHORIZED,
    });
    expect(verify).not.toHaveBeenCalled();
  });

  it('returns UNAUTHORIZED when password does not match', async () => {
    findByEmail.mockResolvedValue(fakeUser);
    verify.mockResolvedValue(false);

    const response = await request(app.getHttpServer())
      .post(loginBase)
      .send({ email: 'user@example.com', password: 'wrong-password' })
      .expect(401);

    expect(response.headers['content-type']).toContain(PROBLEM_MEDIA_TYPE);

    const body = response.body as ProblemDetailsBody;

    expect(body).toMatchObject({
      type: problemTypeUriForCode(API_ERROR_CODE_UNAUTHORIZED),
      title: 'Unauthorized',
      status: 401,
      detail: INVALID_LOGIN_CREDENTIALS_MESSAGE,
      code: API_ERROR_CODE_UNAUTHORIZED,
    });
  });
});
