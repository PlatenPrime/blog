import {
  API_ERROR_CODE_FORBIDDEN,
  PROBLEM_MEDIA_TYPE,
  type LoginUserResponse,
  type ProblemDetailsBody,
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
import { EmailVerificationTokenService } from '../src/auth/email-verification-token.service';
import { RefreshTokenService } from '../src/auth/refresh-token.service';
import type { CmsPostsListResponse } from '../src/cms/cms-posts.controller';
import { API_V1_BASE } from '../src/config/configure-api-http';
import { configureApiHttp } from '../src/config/configure-api-http';
import { configureApiShutdown } from '../src/config/configure-api-shutdown';
import { enableApiCors } from '../src/config/enable-api-cors';
import { PostgresHealthIndicator } from '../src/health/indicators/postgres.health-indicator';
import { PermissionKey } from '../src/rbac/permission-key';
import { INSUFFICIENT_PERMISSION_MESSAGE } from '../src/rbac/permissions-guard.constants';
import { UserPermissionsService } from '../src/rbac/user-permissions.service';
import { createTestDataSourceStub } from '../src/testing/create-test-data-source.stub';
import { PasswordHasherService } from '../src/users/password-hasher.service';
import { UserService } from '../src/users/user.service';
import { createInMemoryUserPermissionsServiceOverride } from './helpers/auth-e2e-in-memory-permissions-store';
import { createInMemoryUserServiceOverride } from './helpers/auth-e2e-in-memory-user-store';

const registerBase = `${API_V1_BASE}/auth/register`;
const loginBase = `${API_V1_BASE}/auth/login`;
const cmsPostsBase = `${API_V1_BASE}/cms/posts`;

describe('Auth register → login → CMS RBAC flow (e2e)', () => {
  let app: INestApplication<App>;
  let inMemoryPermissions: ReturnType<
    typeof createInMemoryUserPermissionsServiceOverride
  >;
  beforeEach(async () => {
    const passwordHasher = new PasswordHasherService();
    const inMemoryUsers = createInMemoryUserServiceOverride(passwordHasher);
    inMemoryPermissions = createInMemoryUserPermissionsServiceOverride();

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
      .overrideProvider(UserPermissionsService)
      .useValue(inMemoryPermissions)
      .overrideProvider(EmailVerificationTokenService)
      .useValue({
        persistForUser: vi.fn().mockResolvedValue({ id: 'evt-1' }),
        findActiveByRawToken: vi.fn(),
        findByRawToken: vi.fn(),
        consume: vi.fn(),
      })
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

  async function registerAndLogin(email: string, password: string) {
    const registerResponse = await request(app.getHttpServer())
      .post(registerBase)
      .send({ email, password })
      .expect(201);

    const registerBody = registerResponse.body as RegisterUserResponse;

    const loginResponse = await request(app.getHttpServer())
      .post(loginBase)
      .send({ email, password })
      .expect(200);

    const loginBody = loginResponse.body as LoginUserResponse;

    expect(loginBody.id).toBe(registerBody.id);

    return { registerBody, loginBody };
  }

  it('returns FORBIDDEN for cms posts when registered user has no permissions', async () => {
    const email = `rbac-flow-${Date.now()}@example.com`;
    const password = 'secret123';

    const { registerBody, loginBody } = await registerAndLogin(email, password);

    const response = await request(app.getHttpServer())
      .get(cmsPostsBase)
      .set('Authorization', `Bearer ${loginBody.accessToken}`)
      .expect(403);

    expect(response.headers['content-type']).toContain(PROBLEM_MEDIA_TYPE);

    const body = response.body as ProblemDetailsBody;

    expect(body).toMatchObject({
      type: problemTypeUriForCode(API_ERROR_CODE_FORBIDDEN),
      title: 'Forbidden',
      status: 403,
      detail: INSUFFICIENT_PERMISSION_MESSAGE,
      code: API_ERROR_CODE_FORBIDDEN,
    });

    expect(
      inMemoryPermissions.findPermissionKeysByUserIdMock,
    ).toHaveBeenCalledWith(registerBody.id);
  });

  it('returns FORBIDDEN for cms posts when user has only posts:write', async () => {
    const email = `rbac-write-only-${Date.now()}@example.com`;
    const password = 'secret123';

    const { registerBody, loginBody } = await registerAndLogin(email, password);

    inMemoryPermissions.setPermissionKeysForUser(registerBody.id, [
      PermissionKey.PostsWrite,
    ]);

    const response = await request(app.getHttpServer())
      .get(cmsPostsBase)
      .set('Authorization', `Bearer ${loginBody.accessToken}`)
      .expect(403);

    expect(response.headers['content-type']).toContain(PROBLEM_MEDIA_TYPE);

    const body = response.body as ProblemDetailsBody;

    expect(body).toMatchObject({
      type: problemTypeUriForCode(API_ERROR_CODE_FORBIDDEN),
      title: 'Forbidden',
      status: 403,
      detail: INSUFFICIENT_PERMISSION_MESSAGE,
      code: API_ERROR_CODE_FORBIDDEN,
    });
  });

  it('returns empty list for cms posts when user has posts:read', async () => {
    const email = `rbac-read-${Date.now()}@example.com`;
    const password = 'secret123';

    const { registerBody, loginBody } = await registerAndLogin(email, password);

    inMemoryPermissions.setPermissionKeysForUser(registerBody.id, [
      PermissionKey.PostsRead,
    ]);

    const response = await request(app.getHttpServer())
      .get(cmsPostsBase)
      .set('Authorization', `Bearer ${loginBody.accessToken}`)
      .expect(200);

    const body = response.body as CmsPostsListResponse;

    expect(body).toEqual({ items: [] });
  });
});
