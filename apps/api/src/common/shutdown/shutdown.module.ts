import { Module } from '@nestjs/common';
import { ApiShutdownCoordinator } from './api-shutdown-coordinator.service';
import { ApiShutdownService } from './api-shutdown.service';
import { InFlightRequestsService } from './in-flight-requests.service';

@Module({
  providers: [
    InFlightRequestsService,
    ApiShutdownService,
    ApiShutdownCoordinator,
  ],
  exports: [InFlightRequestsService, ApiShutdownCoordinator],
})
export class ShutdownModule {}
