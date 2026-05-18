import { Module } from '@nestjs/common';
import { ApiShutdownService } from './api-shutdown.service';

@Module({
  providers: [ApiShutdownService],
})
export class ShutdownModule {}
