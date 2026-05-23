import {
  type AuthMeResponse,
  type LoginUserResponse,
  type RegisterUserResponse,
} from '@blog/shared-contracts';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module';
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
import { createInMemoryUserServiceOverride } from './helpers/auth-e2e-in-memory-user-store';

const registerBase = `${API_V1_BASE}/auth/register`;
const loginBase = `${API_V1_BASE}/auth/login`;
const meBase = `${API_V1_BASE}/auth/me`;

describe('Auth register → login flow (e2e)', () => {
  let app: INestApplication<App>;
  let evPersistForUser: ReturnType<typeof vi.fn>;
  let refreshPersistForUser: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    evPersistForUser = vi.fn().mockResolvedValue({ id: 'evt-1' });
    refreshPersistForUser = vi.fn().mockResolvedValue({ id: 'rt-1' });

    const passwordHasher = new PasswordHasherService();
    const inMemoryUsers = createInMemoryUserServiceOverride(passwordHasher);

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
      .useValue({
        persistForUser: refreshPersistForUser,
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

  it('registers, logs in with the same password, and returns id from GET /auth/me', async () => {
    const email = `flow-${Date.now()}@example.com`;
    const password = 'secret123';

    const registerResponse = await request(app.getHttpServer())
      .post(registerBase)
      .send({ email, password })
      .expect(201);

    const registerBody = registerResponse.body as RegisterUserResponse & {
      passwordHash?: string;
    };

    expect(evPersistForUser).toHaveBeenCalledOnce();
    expect(registerBody.email).toBe(email.trim().toLowerCase());
    expect(registerBody).not.toHaveProperty('passwordHash');
    expect(registerBody.emailVerificationToken).toBeDefined();
    const emailVerificationToken = registerBody.emailVerificationToken!;
    expect(emailVerificationToken.length).toBeGreaterThan(0);

    const loginResponse = await request(app.getHttpServer())
      .post(loginBase)
      .send({ email, password })
      .expect(200);

    const loginBody = loginResponse.body as LoginUserResponse & {
      passwordHash?: string;
    };

    expect(loginBody.id).toBe(registerBody.id);
    expect(loginBody.email).toBe(registerBody.email);
    expect(typeof loginBody.accessToken).toBe('string');
    expect(loginBody.accessToken.length).toBeGreaterThan(0);
    expect(typeof loginBody.refreshToken).toBe('string');
    expect(loginBody.refreshToken.length).toBeGreaterThan(0);
    expect(loginBody).not.toHaveProperty('passwordHash');
    expect(refreshPersistForUser).toHaveBeenCalledOnce();

    const meResponse = await request(app.getHttpServer())
      .get(meBase)
      .set('Authorization', `Bearer ${loginBody.accessToken}`)
      .expect(200);

    const meBody = meResponse.body as AuthMeResponse;

    expect(meBody).toEqual({ id: registerBody.id });
  });
});
