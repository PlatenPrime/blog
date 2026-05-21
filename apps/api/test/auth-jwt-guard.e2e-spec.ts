import {
  API_ERROR_CODE_UNAUTHORIZED,
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
import { INVALID_ACCESS_TOKEN_MESSAGE } from '../src/auth/auth-jwt.constants';
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
const meBase = `${API_V1_BASE}/auth/me`;

const fakeUser: User = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'user@example.com',
  passwordHash: 'argon2id$v=19$m=65536,t=3,p=4$hash',
  emailVerifiedAt: null,
  createdAt: new Date('2026-05-20T10:00:00.000Z'),
  updatedAt: new Date('2026-05-20T10:00:00.000Z'),
};

describe('Auth JWT guard (e2e)', () => {
  let app: INestApplication<App>;
  let findByEmail: ReturnType<typeof vi.fn>;
  let verify: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    findByEmail = vi.fn();
    verify = vi.fn();

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
        persistForUser: vi.fn().mockResolvedValue({ id: 'rt-1' }),
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

  async function loginAccessToken(): Promise<string> {
    findByEmail.mockResolvedValue(fakeUser);
    verify.mockResolvedValue(true);

    const response = await request(app.getHttpServer())
      .post(loginBase)
      .send({ email: 'user@example.com', password: 'secret123' })
      .expect(200);

    const body = response.body as LoginUserResponse;
    expect(body.accessToken.length).toBeGreaterThan(0);
    return body.accessToken;
  }

  it('returns accessToken on successful login', async () => {
    const accessToken = await loginAccessToken();
    expect(typeof accessToken).toBe('string');
  });

  it('returns UNAUTHORIZED for GET /auth/me without Bearer token', async () => {
    const response = await request(app.getHttpServer()).get(meBase).expect(401);

    expect(response.headers['content-type']).toContain(PROBLEM_MEDIA_TYPE);

    const body = response.body as ProblemDetailsBody;

    expect(body).toMatchObject({
      type: problemTypeUriForCode(API_ERROR_CODE_UNAUTHORIZED),
      title: 'Unauthorized',
      status: 401,
      detail: INVALID_ACCESS_TOKEN_MESSAGE,
      code: API_ERROR_CODE_UNAUTHORIZED,
    });
  });

  it('returns AuthMeResponse for GET /auth/me with valid Bearer token', async () => {
    const accessToken = await loginAccessToken();

    const response = await request(app.getHttpServer())
      .get(meBase)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = response.body as AuthMeResponse;

    expect(body).toEqual({ id: fakeUser.id });
  });

  it('returns UNAUTHORIZED for GET /auth/me with invalid Bearer token', async () => {
    const response = await request(app.getHttpServer())
      .get(meBase)
      .set('Authorization', 'Bearer not-a-valid-jwt')
      .expect(401);

    expect(response.headers['content-type']).toContain(PROBLEM_MEDIA_TYPE);

    const body = response.body as ProblemDetailsBody;

    expect(body).toMatchObject({
      type: problemTypeUriForCode(API_ERROR_CODE_UNAUTHORIZED),
      title: 'Unauthorized',
      status: 401,
      detail: INVALID_ACCESS_TOKEN_MESSAGE,
      code: API_ERROR_CODE_UNAUTHORIZED,
    });
  });
});
