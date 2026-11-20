import { describe, expect, it } from 'vitest'

import { PHONICS_PROMPTS } from '../content/level6'
import { createInitialSession, sessionReducer } from './level6Machine'

function toPhonicsShip() {
  let s = createInitialSession()
  s = { ...s, phase: 'phonics', phonicsIndex: 2, promptMissCount: 0 }
  const ship = PHONICS_PROMPTS[2]
  expect(ship?.id).toBe('ship')
  return s
}

describe('anti-cycling miss rule on ship', () => {
  it('does not bolt after wrong-only taps', () => {
    let s = toPhonicsShip()
    const wrongs = ['s', 't'] as const
    for (const tile of wrongs) {
      s = sessionReducer(s, { type: 'PHONICS_TILE', tile })
      expect(s.planks.filter((p) => p.kind === 'bolted')).toHaveLength(0)
    }
    s = sessionReducer(s, { type: 'PHONICS_TILE', tile: 's' })
    expect(s.planks.filter((p) => p.kind === 'bolted')).toHaveLength(0)
    expect(s.promptMissCount).toBeGreaterThanOrEqual(2)
  })

  it('bolts only on correct tap after one miss', () => {
    let s = toPhonicsShip()
    s = sessionReducer(s, { type: 'PHONICS_TILE', tile: 's' })
    s = sessionReducer(s, { type: 'PHONICS_TILE', tile: 'sh' })
    expect(s.planks).toEqual([{ promptId: 'ship', kind: 'bolted' }])
  })

  it('practice plank after modeled correct following two misses', () => {
    let s = toPhonicsShip()
    s = sessionReducer(s, { type: 'PHONICS_TILE', tile: 's' })
    s = sessionReducer(s, { type: 'PHONICS_TILE', tile: 't' })
    s = sessionReducer(s, { type: 'PHONICS_TILE', tile: 'sh' })
    expect(s.planks).toEqual([{ promptId: 'ship', kind: 'practice' }])
  })
})