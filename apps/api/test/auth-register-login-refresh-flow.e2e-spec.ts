import {
  API_ERROR_CODE_UNAUTHORIZED,
  PROBLEM_MEDIA_TYPE,
  type LoginUserResponse,
  type ProblemDetailsBody,
  type RefreshSessionResponse,
  type RegisterUserResponse,
  problemTypeUriForCode,
} from '@blog/shared-contracts';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module';
import { INVALID_REFRESH_TOKEN_MESSAGE } from '../src/auth/auth-credentials.constants';
import { EmailVerificationTokenService } from '../src/auth/email-verification-token.service';
import { RefreshTokenService } from '../src/auth/refresh-token.service';
import { API_V1_BASE } from '../src/config/configure-api-http';
import { configureApiHttp } from '../src/config/configure-api-http';
import { configureApiShutdown } from '../src/config/configure-api-shutdown';
import { enableApiCors } from '../src/config/enable-api-cors';
import { PostgresHealthIndicator } from '../src/health/indicators/postgres.health-indicator';
import { createTestDataSourceStub } from '../src/testing/create-test-data-source.stub';
import { PasswordHasherService } from '../src/users/password-hasher.service';
import { UserService } from '../src/users/user.service';
import { createInMemoryRefreshTokenServiceOverride } from './helpers/auth-e2e-in-memory-refresh-token-store';
import { createInMemoryUserServiceOverride } from './helpers/auth-e2e-in-memory-user-store';

const registerBase = `${API_V1_BASE}/auth/register`;
const loginBase = `${API_V1_BASE}/auth/login`;
const refreshBase = `${API_V1_BASE}/auth/refresh`;

describe('Auth register → login → refresh flow (e2e)', () => {
  let app: INestApplication<App>;
  let evPersistForUser: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    evPersistForUser = vi.fn().mockResolvedValue({ id: 'evt-1' });

    const passwordHasher = new PasswordHasherService();
    const inMemoryUsers = createInMemoryUserServiceOverride(passwordHasher);
    const inMemoryRefreshTokens = createInMemoryRefreshTokenServiceOverride();

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
      .useValue(inMemoryUsers)
      .overrideProvider(EmailVerificationTokenService)
      .useValue({
        persistForUser: evPersistForUser,
        findActiveByRawToken: vi.fn(),
        findByRawToken: vi.fn(),
        consume: vi.fn(),
      })
      .overrideProvider(RefreshTokenService)
      .useValue(inMemoryRefreshTokens)
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

  async function registerAndLogin(email: string, password: string) {
    await request(app.getHttpServer())
      .post(registerBase)
      .send({ email, password })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post(loginBase)
      .send({ email, password })
      .expect(200);

    return loginResponse.body as LoginUserResponse;
  }

  it('registers, logs in, and rotates refresh token', async () => {
    const email = `refresh-flow-${Date.now()}@example.com`;
    const password = 'secret123';

    const registerResponse = await request(app.getHttpServer())
      .post(registerBase)
      .send({ email, password })
      .expect(201);

    const registerBody = registerResponse.body as RegisterUserResponse;

    expect(evPersistForUser).toHaveBeenCalledOnce();
    expect(registerBody.email).toBe(email.trim().toLowerCase());

    const loginResponse = await request(app.getHttpServer())
      .post(loginBase)
      .send({ email, password })
      .expect(200);

    const loginBody = loginResponse.body as LoginUserResponse;

    expect(typeof loginBody.refreshToken).toBe('string');
    expect(loginBody.refreshToken.length).toBeGreaterThan(0);

    const refreshResponse = await request(app.getHttpServer())
      .post(refreshBase)
      .send({ refreshToken: loginBody.refreshToken })
      .expect(200);

    const refreshBody = refreshResponse.body as RefreshSessionResponse;

    expect(refreshBody.refreshToken).not.toBe(loginBody.refreshToken);
    expect(typeof refreshBody.accessToken).toBe('string');
    expect(refreshBody.accessToken.length).toBeGreaterThan(0);

    const secondRefreshResponse = await request(app.getHttpServer())
      .post(refreshBase)
      .send({ refreshToken: refreshBody.refreshToken })
      .expect(200);

    const secondRefreshBody =
      secondRefreshResponse.body as RefreshSessionResponse;

    expect(secondRefreshBody.refreshToken).not.toBe(refreshBody.refreshToken);
    expect(typeof secondRefreshBody.accessToken).toBe('string');
    expect(secondRefreshBody.accessToken.length).toBeGreaterThan(0);
  });

  it('returns UNAUTHORIZED on reused refresh after rotation and revokes token family', async () => {
    const email = `refresh-reuse-${Date.now()}@example.com`;
    const password = 'secret123';

    const loginBody = await registerAndLogin(email, password);
    const loginRefreshToken = loginBody.refreshToken;

    const refreshResponse = await request(app.getHttpServer())
      .post(refreshBase)
      .send({ refreshToken: loginRefreshToken })
      .expect(200);

    const successorRefreshToken = (
      refreshResponse.body as RefreshSessionResponse
    ).refreshToken;

    const reuseResponse = await request(app.getHttpServer())
      .post(refreshBase)
      .send({ refreshToken: loginRefreshToken })
      .expect(401);

    expect(reuseResponse.headers['content-type']).toContain(PROBLEM_MEDIA_TYPE);

    const reuseBody = reuseResponse.body as ProblemDetailsBody;

    expect(reuseBody).toMatchObject({
      type: problemTypeUriForCode(API_ERROR_CODE_UNAUTHORIZED),
      title: 'Unauthorized',
      status: 401,
      detail: INVALID_REFRESH_TOKEN_MESSAGE,
      code: API_ERROR_CODE_UNAUTHORIZED,
    });

    await request(app.getHttpServer())
      .post(refreshBase)
      .send({ refreshToken: successorRefreshToken })
      .expect(401);
  });
});
