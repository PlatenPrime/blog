import { Controller, Get } from '@nestjs/common';

/**
 * Test-only slow handler for REQUEST_TIMEOUT contract tests. Not registered in AppModule.
 */
@Controller({ path: '_contract/slow', version: '1' })
export class SlowTestController {
  @Get()
  async slow(): Promise<{ readonly ok: true }> {
    await new Promise((resolve) => setTimeout(resolve, 2_000));
    return { ok: true };
  }
}
