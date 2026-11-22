import { describe, expect, it } from 'vitest'

import { LANDING_FLOATERS } from './landingTokens'

describe('landing floaters', () => {
  it('uses seven grade-1 tokens with distinct rest tilts', () => {
    const ids = LANDING_FLOATERS.map((t) => t.id).sort()
    expect(ids).toEqual([
      'floater_2',
      'floater_8',
      'floater_cat',
      'floater_plus',
      'floater_sentence',
      'floater_sh',
      'floater_ship',
    ])
    expect(LANDING_FLOATERS).toHaveLength(7)
    const tilts = new Set(LANDING_FLOATERS.map((t) => t.restRotate))
    expect(tilts.size).toBeGreaterThanOrEqual(5)
  })
})