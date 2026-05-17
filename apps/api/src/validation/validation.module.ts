import { Module } from '@nestjs/common';
import { ValidationSmokeController } from './validation-smoke.controller';

@Module({
  controllers: [ValidationSmokeController],
})
export class ValidationModule {}
