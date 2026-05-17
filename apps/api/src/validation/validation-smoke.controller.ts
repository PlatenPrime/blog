import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ValidationSmokeBodyDto } from './validation-smoke.dto';

@Controller()
export class ValidationSmokeController {
  @Post('validation-smoke')
  @HttpCode(HttpStatus.OK)
  validationSmoke(@Body() body: ValidationSmokeBodyDto): { count: number } {
    return { count: body.count };
  }
}
