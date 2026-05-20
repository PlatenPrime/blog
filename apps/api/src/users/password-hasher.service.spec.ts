import { beforeEach, describe, expect, it } from 'vitest';
import { PasswordHasherService } from './password-hasher.service';

describe('PasswordHasherService', () => {
  let service: PasswordHasherService;

  beforeEach(() => {
    service = new PasswordHasherService();
  });

  it('hash returns a non-empty string different from the plaintext', async () => {
    const plain = 'correct-horse-battery-staple';
    const hashed = await service.hash(plain);

    expect(hashed.length).toBeGreaterThan(0);
    expect(hashed).not.toBe(plain);
  });

  it('verify returns true for matching password and false otherwise', async () => {
    const plain = 'my-secret-password';
    const hashed = await service.hash(plain);

    await expect(service.verify(plain, hashed)).resolves.toBe(true);
    await expect(service.verify('wrong', hashed)).resolves.toBe(false);
  });

  it('two hashes of the same password are distinct (salt)', async () => {
    const plain = 'same-password-twice';
    const a = await service.hash(plain);
    const b = await service.hash(plain);

    expect(a).not.toBe(b);
    await expect(service.verify(plain, a)).resolves.toBe(true);
    await expect(service.verify(plain, b)).resolves.toBe(true);
  });
});
