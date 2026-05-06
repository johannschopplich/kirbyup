import { describe, expect, it } from 'vitest'
import { kirbyup } from '../src/client/plugin'

describe('kirbyup.import', () => {
  it('throws when called outside the kirbyup build pipeline', () => {
    expect(() => kirbyup.import('./blocks/*.vue')).toThrow(/kirbyup build pipeline/)
  })
})
