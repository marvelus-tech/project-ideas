import { describe, expect, it } from 'vitest'

import { LANDING_FLOATERS } from './landingTokens'

describe('landing floaters', () => {
  it('uses six extracted sprites from the approved master', () => {
    const ids = LANDING_FLOATERS.map((t) => t.id).sort()
    expect(ids).toEqual([
      'floater_2',
      'floater_8',
      'floater_plus',
      'floater_sentence',
      'floater_sh',
      'floater_ship',
    ])
  })
})