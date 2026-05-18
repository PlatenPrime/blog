import './instrumentation';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { configureApiHttp } from './config/configure-api-http';
import { enableApiCors } from './config/enable-api-cors';

const DEFAULT_API_PORT = 4000;
const MAX_PORT_ATTEMPTS = 20;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  const bootstrapLogger = app.get(Logger);
  enableApiCors(app);
  configureApiHttp(app);
  const config = app.get(ConfigService);
  const initialPortRaw = config.get<number>('PORT');
  const initialPort =
    typeof initialPortRaw === 'number' &&
    Number.isFinite(initialPortRaw) &&
    initialPortRaw >= 1
      ? initialPortRaw
      : DEFAULT_API_PORT;

  for (let attempt = 0; attempt < MAX_PORT_ATTEMPTS; attempt += 1) {
    const port = initialPort + attempt;

    try {
      await app.listen(port);
      bootstrapLogger.log(`Application is running on port ${port}`);
      return;
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'EADDRINUSE'
      ) {
        bootstrapLogger.warn(`Port ${port} is busy. Trying ${port + 1}...`);
        continue;
      }

      throw error;
    }
  }

  throw new Error(
    `Unable to start server. No free port in range ${initialPort}-${
      initialPort + MAX_PORT_ATTEMPTS - 1
    }.`,
  );
}
void bootstrap();
