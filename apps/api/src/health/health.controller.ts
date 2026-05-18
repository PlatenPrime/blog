import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
} from '@nestjs/terminus';
import { PostgresHealthIndicator } from './indicators/postgres.health-indicator';

@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly postgres: PostgresHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  liveness(): Promise<HealthCheckResult> {
    return this.health.check([
      () =>
        Promise.resolve({
          api: { status: 'up' },
        }),
    ]);
  }

  @Get('ready')
  @HealthCheck()
  readiness(): Promise<HealthCheckResult> {
    return this.health.check([() => this.postgres.isHealthy('database')]);
  }
}
