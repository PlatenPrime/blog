import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { describe, expect, it } from 'vitest';
import { RequestContextModule } from '../common/request-context/request-context.module';
import { validateRootEnv } from '../config/env.schema';
import { DatabaseModule } from '../database/database.module';
import { createTestDataSourceStub } from '../testing/create-test-data-source.stub';
import { SecurityAuditModule } from './security-audit.module';
import { SecurityAuditService } from './security-audit.service';

describe('SecurityAuditModule', () => {
  it('registers security audit entities via forFeature', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, validate: validateRootEnv }),
        RequestContextModule,
        DatabaseModule,
        SecurityAuditModule,
      ],
    })
      .overrideProvider(DataSource)
      .useValue(createTestDataSourceStub())
      .compile();

    expect(moduleRef.get(SecurityAuditModule)).toBeDefined();
    expect(moduleRef.get(SecurityAuditService)).toBeInstanceOf(
      SecurityAuditService,
    );
  });
});
