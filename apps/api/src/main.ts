import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const envPaths = [
  resolve(__dirname, '../../../.env'),
  resolve(process.cwd(), '.env'),
];

const envPath = envPaths.find((pathToEnv) => existsSync(pathToEnv));

if (envPath) {
  config({ path: envPath });
}

const MAX_PORT_ATTEMPTS = 20;
const bootstrapLogger = new Logger('Bootstrap');

const resolveInitialPort = (): number => {
  const parsedPort = Number.parseInt(process.env.PORT ?? '3000', 10);
  return Number.isNaN(parsedPort) ? 3000 : parsedPort;
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const initialPort = resolveInitialPort();

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
