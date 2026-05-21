import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { describe, expect, it } from 'vitest';
import { validateRootEnv } from '../config/env.schema';
import { DatabaseModule } from '../database/database.module';
import { createTestDataSourceStub } from '../testing/create-test-data-source.stub';
import { RbacModule } from './rbac.module';

describe('RbacModule', () => {
  it('registers RBAC entities via forFeature', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ validate: validateRootEnv }),
        DatabaseModule,
        RbacModule,
      ],
    })
      .overrideProvider(DataSource)
      .useValue(createTestDataSourceStub())
      .compile();

    expect(moduleRef.get(RbacModule)).toBeDefined();
  });
});
