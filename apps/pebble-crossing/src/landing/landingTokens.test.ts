import { describe, expect, it } from 'vitest'

import { LANDING_FLOATERS } from './landingTokens'

describe('landing floaters', () => {
  it('ships grade 1 literacy and within-10 math chips', () => {
    const ids = LANDING_FLOATERS.map((t) => t.id).sort()
    expect(ids).toEqual(['cat', 'sh', 'ship', 'sum7', 'sum8', 'ten', 'the'])
  })
})