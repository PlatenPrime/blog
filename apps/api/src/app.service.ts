import { Injectable } from '@nestjs/common';
import { SHARED_CONTRACTS_VERSION } from '@blog/shared-contracts';

@Injectable()
export class AppService {
  getHello(): string {
    return `Hello World! (${SHARED_CONTRACTS_VERSION})`;
  }
}
