import { describe, expect, it } from 'vitest'
import { SHARED_CONTRACTS_VERSION } from '@nestjs-st/shared-contracts'

describe('@nestjs-st/shared-contracts', () => {
  it('exposes SHARED_CONTRACTS_VERSION', () => {
    expect(SHARED_CONTRACTS_VERSION).toBe('0.0.1')
  })
})
