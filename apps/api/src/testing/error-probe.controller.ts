import {
  BadRequestException,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Param,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * Test-only controller for contract tests. Registered only in Vitest modules, never in AppModule.
 */
@Controller({ path: '_contract/errors', version: '1' })
export class ErrorProbeController {
  @Get(':scenario')
  probe(@Param('scenario') scenario: string): never {
    switch (scenario) {
      case 'unauthorized':
        throw new UnauthorizedException('Contract probe: unauthorized');
      case 'forbidden':
        throw new ForbiddenException('Contract probe: forbidden');
      case 'conflict':
        throw new ConflictException('Contract probe: conflict');
      case 'bad-request':
        throw new BadRequestException('Contract probe: bad request');
      case 'internal':
        throw new Error('Contract probe: internal');
      default:
        throw new BadRequestException(
          `Unknown error probe scenario: ${scenario}`,
        );
    }
  }
}
