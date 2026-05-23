import {
  API_ERROR_CODE_CONFLICT,
  API_ERROR_CODE_VALIDATION,
  PROBLEM_MEDIA_TYPE,
  type ProblemDetailsBody,
  type RegisterUserResponse,
  problemTypeUriForCode,
} from '@blog/shared-contracts';
import { ConflictException, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module';
import { EmailVerificationTokenService } from '../src/auth/email-verification-token.service';
import { API_V1_BASE } from '../src/config/configure-api-http';
import { configureApiHttp } from '../src/config/configure-api-http';
import { configureApiShutdown } from '../src/config/configure-api-shutdown';
import { enableApiCors } from '../src/config/enable-api-cors';
import { PostgresHealthIndicator } from '../src/health/indicators/postgres.health-indicator';
import { createTestDataSourceStub } from '../src/testing/create-test-data-source.stub';
import type { User } from '../src/users/user.entity';
import { USER_EMAIL_ALREADY_REGISTERED_MESSAGE } from '../src/users/user-email.constants';
import { UserService } from '../src/users/user.service';

const registerBase = `${API_V1_BASE}/auth/register`;

const fakeUser: User = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'user@example.com',
  passwordHash: 'argon2id$v=19$m=65536,t=3,p=4$hash',
  emailVerifiedAt: null,
  createdAt: new Date('2026-05-20T10:00:00.000Z'),
  updatedAt: new Date('2026-05-20T10:00:00.000Z'),
};

describe('Auth register (e2e)', () => {
  let app: INestApplication<App>;
  let create: ReturnType<typeof vi.fn>;
  let findByEmail: ReturnType<typeof vi.fn>;
  let evPersistForUser: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    create = vi.fn().mockResolvedValue(fakeUser);
    findByEmail = vi.fn();
    evPersistForUser = vi.fn().mockResolvedValue({ id: 'evt-1' });

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
      .useValue({ create, findByEmail })
      .overrideProvider(EmailVerificationTokenService)
      .useValue({
        invalidateActiveForUser: vi.fn(),
        persistForUser: evPersistForUser,
        findActiveByRawToken: vi.fn(),
        findByRawToken: vi.fn(),
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

  it('returns VALIDATION_FAILED with details for an invalid register body', async () => {
    const response = await request(app.getHttpServer())
      .post(registerBase)
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

  it('rejects non-whitelisted properties on register with 400', async () => {
    const response = await request(app.getHttpServer())
      .post(registerBase)
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

  it('creates a user and returns RegisterUserResponse with emailVerificationToken', async () => {
    const response = await request(app.getHttpServer())
      .post(registerBase)
      .send({ email: 'user@example.com', password: 'secret123' })
      .expect(201);

    const body = response.body as RegisterUserResponse & {
      passwordHash?: string;
    };

    expect(evPersistForUser).toHaveBeenCalledOnce();
    const persistArgs = evPersistForUser.mock.calls[0]?.[0] as {
      userId: string;
      rawToken: string;
      expiresAt: Date;
    };
    expect(persistArgs.userId).toBe(fakeUser.id);
    expect(typeof persistArgs.rawToken).toBe('string');
    expect(persistArgs.rawToken.length).toBeGreaterThan(0);

    expect(body).toEqual({
      id: fakeUser.id,
      email: fakeUser.email,
      emailVerificationToken: persistArgs.rawToken,
      emailVerifiedAt: null,
      createdAt: fakeUser.createdAt.toISOString(),
      updatedAt: fakeUser.updatedAt.toISOString(),
    });
    expect(body).not.toHaveProperty('passwordHash');

    expect(create).toHaveBeenCalledWith({
      email: 'user@example.com',
      plainPassword: 'secret123',
    });
  });

  it('returns CONFLICT when UserService rejects duplicate email', async () => {
    create.mockRejectedValue(
      new ConflictException(USER_EMAIL_ALREADY_REGISTERED_MESSAGE),
    );

    const response = await request(app.getHttpServer())
      .post(registerBase)
      .send({ email: 'user@example.com', password: 'secret123' })
      .expect(409);

    expect(response.headers['content-type']).toContain(PROBLEM_MEDIA_TYPE);

    const body = response.body as ProblemDetailsBody;

    expect(body).toMatchObject({
      type: problemTypeUriForCode(API_ERROR_CODE_CONFLICT),
      title: 'Conflict',
      status: 409,
      detail: USER_EMAIL_ALREADY_REGISTERED_MESSAGE,
      code: API_ERROR_CODE_CONFLICT,
    });
  });
});
