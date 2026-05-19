import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { describe, expect, it } from 'vitest';
import { validateRootEnv } from '../config/env.schema';
import { createTestDataSourceStub } from '../testing/create-test-data-source.stub';
import { DatabaseModule } from './database.module';

describe('DatabaseModule', () => {
  it('registers TypeORM DataSource via forRootAsync', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ validate: validateRootEnv }),
        DatabaseModule,
      ],
    })
      .overrideProvider(DataSource)
      .useValue(createTestDataSourceStub())
      .compile();

    const dataSource = moduleRef.get(DataSource);

    expect(dataSource.isInitialized).toBe(true);
    expect(dataSource.manager).toBeDefined();
  });
});
