import { describe, expect, it } from 'vitest'
import { SHARED_CONTRACTS_VERSION } from '@blog/shared-contracts'

describe('@blog/shared-contracts', () => {
  it('exposes SHARED_CONTRACTS_VERSION', () => {
    expect(SHARED_CONTRACTS_VERSION).toBe('0.0.1')
  })
})
