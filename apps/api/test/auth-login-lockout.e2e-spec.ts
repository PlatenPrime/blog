import {
  API_ERROR_CODE_TOO_MANY_REQUESTS,
  API_ERROR_CODE_UNAUTHORIZED,
  PROBLEM_MEDIA_TYPE,
  type LoginUserResponse,
  type ProblemDetailsBody,
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
import { INVALID_LOGIN_CREDENTIALS_MESSAGE } from '../src/auth/auth-credentials.constants';
import { LOGIN_LOCKOUT_MESSAGE } from '../src/auth/login-lockout.constants';
import { LoginLockoutService } from '../src/auth/login-lockout.service';
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
  createdAt: new Date('2026-05-20T10:00:00.000Z'),
  updatedAt: new Date('2026-05-20T10:00:00.000Z'),
};

const e2eLockoutConfig = {
  getOrThrow: (key: string) => {
    if (key === 'LOGIN_LOCKOUT_MAX_ATTEMPTS') {
      return 2;
    }
    if (key === 'LOGIN_LOCKOUT_WINDOW_MS') {
      return 60_000;
    }
    if (key === 'LOGIN_LOCKOUT_DURATION_MS') {
      return 120_000;
    }
    throw new Error(`unexpected config key in e2e lockout: ${key}`);
  },
} as unknown as ConfigService;

describe('Auth login lockout (e2e)', () => {
  let app: INestApplication<App>;
  let findByEmail: ReturnType<typeof vi.fn>;
  let verify: ReturnType<typeof vi.fn>;
  let persistForUser: ReturnType<typeof vi.fn>;
  let loginLockout: LoginLockoutService;

  beforeEach(async () => {
    findByEmail = vi.fn();
    verify = vi.fn();
    persistForUser = vi.fn().mockResolvedValue({ id: 'rt-1' });
    loginLockout = new LoginLockoutService(e2eLockoutConfig);

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
      .overrideProvider(LoginLockoutService)
      .useValue(loginLockout)
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

  const loginBody = {
    email: 'user@example.com',
    password: 'wrong-password',
  };

  it('returns 401 for failed attempts below lockout threshold', async () => {
    findByEmail.mockResolvedValue(fakeUser);
    verify.mockResolvedValue(false);

    await request(app.getHttpServer())
      .post(loginBase)
      .send(loginBody)
      .expect(401);

    const second = await request(app.getHttpServer())
      .post(loginBase)
      .send(loginBody)
      .expect(401);

    const body = second.body as ProblemDetailsBody;
    expect(body.code).toBe(API_ERROR_CODE_UNAUTHORIZED);
    expect(body.detail).toBe(INVALID_LOGIN_CREDENTIALS_MESSAGE);
  });

  it('returns 429 TOO_MANY_REQUESTS after max failed attempts', async () => {
    findByEmail.mockResolvedValue(fakeUser);
    verify.mockResolvedValue(false);

    await request(app.getHttpServer()).post(loginBase).send(loginBody);
    await request(app.getHttpServer()).post(loginBase).send(loginBody);

    const response = await request(app.getHttpServer())
      .post(loginBase)
      .send(loginBody)
      .expect(429);

    expect(response.headers['content-type']).toContain(PROBLEM_MEDIA_TYPE);

    const body = response.body as ProblemDetailsBody;
    expect(body).toMatchObject({
      type: problemTypeUriForCode(API_ERROR_CODE_TOO_MANY_REQUESTS),
      title: 'Too Many Requests',
      status: 429,
      detail: LOGIN_LOCKOUT_MESSAGE,
      code: API_ERROR_CODE_TOO_MANY_REQUESTS,
    });
  });

  it('does not call findByEmail when account is locked', async () => {
    findByEmail.mockResolvedValue(fakeUser);
    verify.mockResolvedValue(false);

    await request(app.getHttpServer()).post(loginBase).send(loginBody);
    await request(app.getHttpServer()).post(loginBase).send(loginBody);
    findByEmail.mockClear();

    await request(app.getHttpServer())
      .post(loginBase)
      .send(loginBody)
      .expect(429);

    expect(findByEmail).not.toHaveBeenCalled();
  });

  it('counts failures for unknown email and locks out', async () => {
    findByEmail.mockResolvedValue(null);

    await request(app.getHttpServer())
      .post(loginBase)
      .send({ email: 'missing@example.com', password: 'secret123' });
    await request(app.getHttpServer())
      .post(loginBase)
      .send({ email: 'missing@example.com', password: 'secret123' });

    const response = await request(app.getHttpServer())
      .post(loginBase)
      .send({ email: 'missing@example.com', password: 'secret123' })
      .expect(429);

    expect((response.body as ProblemDetailsBody).code).toBe(
      API_ERROR_CODE_TOO_MANY_REQUESTS,
    );
  });

  it('clears failure streak after successful login so attempts count from zero', async () => {
    findByEmail.mockResolvedValue(fakeUser);
    verify.mockResolvedValue(false);

    await request(app.getHttpServer())
      .post(loginBase)
      .send(loginBody)
      .expect(401);

    verify.mockResolvedValue(true);

    const response = await request(app.getHttpServer())
      .post(loginBase)
      .send({ email: 'user@example.com', password: 'secret123' })
      .expect(200);

    const body = response.body as LoginUserResponse;
    expect(body.email).toBe(fakeUser.email);
    expect(typeof body.accessToken).toBe('string');

    verify.mockResolvedValue(false);
    await request(app.getHttpServer())
      .post(loginBase)
      .send(loginBody)
      .expect(401);
  });
});
