import {
  Controller,
  Get,
  Module,
  RequestMethod,
  VersioningType,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  API_DEFAULT_VERSION,
  API_GLOBAL_PREFIX,
  API_V1_BASE,
  configureApiHttp,
} from './configure-api-http';

@Controller('probe')
class ProbeController {
  @Get()
  probe(): string {
    return 'ok';
  }
}

@Module({ controllers: [ProbeController] })
class ProbeModule {}

describe('configureApiHttp', () => {
  it('wires global prefix and URI versioning with expected options', () => {
    const app = {
      setGlobalPrefix: vi.fn(),
      enableVersioning: vi.fn(),
    };

    configureApiHttp(app as never);

    expect(app.setGlobalPrefix).toHaveBeenCalledWith(API_GLOBAL_PREFIX, {
      exclude: [
        { path: 'health', method: RequestMethod.ALL },
        { path: 'health/ready', method: RequestMethod.ALL },
        { path: 'metrics', method: RequestMethod.GET },
      ],
    });
    expect(app.enableVersioning).toHaveBeenCalledWith({
      type: VersioningType.URI,
      defaultVersion: API_DEFAULT_VERSION,
    });
  });

  describe('integration', () => {
    let closeApp: (() => Promise<void>) | undefined;

    afterEach(async () => {
      await closeApp?.();
      closeApp = undefined;
    });

    it('serves versioned routes under API_V1_BASE', async () => {
      const app = await NestFactory.create(ProbeModule, {
        logger: false,
      });
      configureApiHttp(app);
      await app.init();
      closeApp = () => app.close();

      const server = app.getHttpServer() as Parameters<typeof request>[0];
      await request(server)
        .get(`${API_V1_BASE}/probe`)
        .expect(200)
        .expect('ok');
    });
  });
});
