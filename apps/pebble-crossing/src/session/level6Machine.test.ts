import { describe, expect, it } from 'vitest'

import { PHONICS_PROMPTS, missCoach } from '../content/level6'
import { classifySentence, pronunciationClaim, sentenceClaim, sentenceRecovery } from '../lib/speech'
import { isParentEntry, parentHref } from './parentEntry'
import { overlayFlags } from '../assets/world/worldAssets'
import { atPhonicsChoose, piecesRemaining, sessionReducer, shuffleWithSeed } from './level6Machine'
import { buildParentReport, confirmParentRead, formatParentSentence } from './sessionStats'

describe('anti-guessing phonics', () => {
  it('keeps three tiles and withholds a bolt after wrong ship taps', () => {
    let state = atPhonicsChoose(2)
    const prompt = PHONICS_PROMPTS[2]!
    expect(prompt.tiles).toHaveLength(3)
    state = sessionReducer(state, { type: 'PHONICS_TILE', tile: 's' })
    state = sessionReducer(state, { type: 'RESUME_INPUT' })
    state = sessionReducer(state, { type: 'PHONICS_TILE', tile: 't' })
    expect(state.planks).toEqual([])
    expect(state.modeled).toBe(true)
    expect(shuffleWithSeed(prompt.tiles, state.shuffleSeed)).toHaveLength(3)
    state = sessionReducer(state, { type: 'RESUME_INPUT' })
    state = sessionReducer(state, { type: 'PHONICS_TILE', tile: 'sh' })
    expect(state.pendingKind).toBe('practice')
    state = sessionReducer(state, { type: 'BLEND_DONE' })
    state = sessionReducer(state, { type: 'PRODUCTION_DONE', attemptDetected: false })
    expect(state.planks).toEqual([{ promptId: 'ship', kind: 'practice' }])
  })

  it('bolts an independent ship choice and changes the world only after the word is used', () => {
    let state = atPhonicsChoose(2)
    state = sessionReducer(state, { type: 'PHONICS_TILE', tile: 'sh' })
    expect(state.world.ship).toBe('away')
    expect(state.pendingKind).toBe('bolted')
    state = sessionReducer(state, { type: 'BLEND_DONE' })
    state = sessionReducer(state, { type: 'PRODUCTION_DONE', attemptDetected: true })
    expect(state.planks).toEqual([{ promptId: 'ship', kind: 'bolted' }])
    expect(state.world.ship).toBe('docked')
  })

  it('makes cat reveal Kit only after the sound choice is used', () => {
    let state = atPhonicsChoose(0)
    state = sessionReducer(state, { type: 'PHONICS_TILE', tile: 'c' })
    expect(state.world.kit).toBe('hidden')
    state = sessionReducer(state, { type: 'BLEND_DONE' })
    state = sessionReducer(state, { type: 'PRODUCTION_DONE', attemptDetected: false })
    expect(state.world.kit).toBe('arrived')
  })

  it('treats a correct tap after a miss as practice, not a fresh bolt', () => {
    let state = atPhonicsChoose(0)
    state = sessionReducer(state, { type: 'PHONICS_TILE', tile: 's' })
    state = sessionReducer(state, { type: 'RESUME_INPUT' })
    state = sessionReducer(state, { type: 'PHONICS_TILE', tile: 'c' })
    expect(state.pendingKind).toBe('practice')
    expect(state.pendingFirstTry).toBe(false)
    state = sessionReducer(state, { type: 'BLEND_DONE' })
    state = sessionReducer(state, { type: 'PRODUCTION_DONE', attemptDetected: false })
    expect(state.planks).toEqual([{ promptId: 'cat', kind: 'practice' }])
    expect(state.world.kit).toBe('arrived')
  })

  it('ignores a second tap while the first attempt is closed', () => {
    let state = atPhonicsChoose(2)
    state = sessionReducer(state, { type: 'PHONICS_TILE', tile: 's' })
    const misses = state.promptMissCount
    state = sessionReducer(state, { type: 'PHONICS_TILE', tile: 'sh' })
    expect(state.promptMissCount).toBe(misses)
    expect(state.pendingKind).toBeNull()
  })
})

describe('piece counter', () => {
  it('drops when a math post is placed and stays put across a miss', () => {
    let state = atPhonicsChoose(0)
    state = {
      ...state,
      phase: 'math',
      planks: PHONICS_PROMPTS.map((prompt) => ({ promptId: prompt.id, kind: 'bolted' as const })),
      retrievalKind: 'bolted',
      world: { ...state.world, rope: 'tight' },
      inputOpen: true,
    }
    expect(piecesRemaining(state)).toBe(5)
    const missed = sessionReducer(state, { type: 'MATH_TILE', value: 4 })
    expect(piecesRemaining(missed)).toBe(5)
    const placed = sessionReducer(sessionReducer(missed, { type: 'RESUME_INPUT' }), { type: 'MATH_TILE', value: 5 })
    expect(placed.posts).toEqual([{ promptId: 'm1', kind: 'helped' }])
    expect(piecesRemaining(placed)).toBe(4)
  })
})

describe('speech claims', () => {
  it('finishes a dead microphone without another speech callback', () => {
    expect(sentenceRecovery('denied')).toBe('mic_off')
    expect(sentenceRecovery('unsupported')).toBe('mic_off')
    expect(sentenceRecovery('timeout')).toBe('mic_off')
    expect(sentenceRecovery('silence')).toBe('unclear')
    expect(sentenceRecovery('unclear')).toBe('unclear')
    expect(sentenceRecovery('likely_words')).toBe('attempt')
  })

  it('does not treat a partial or loose transcript as fluency', () => {
    expect(classifySentence('the cat sat on a ship', 0.4)).toBe('unclear')
    expect(classifySentence('the cat sat on a shipping', 0.9)).toBe('unclear')
    expect(classifySentence('the cat sat on a ship', 0.9)).toBe('likely_words')
    expect(sentenceClaim('likely_words')).toBe('not_a_fluency_claim')
    expect(pronunciationClaim()).toBe('not_assessed')
  })

  it('keeps mic-off and detected attempts out of mastery language', () => {
    let state = atPhonicsChoose(0)
    state = { ...state, phase: 'sentence' }
    state = sessionReducer(state, { type: 'SENTENCE_RESULT', quality: 'mic_off' })
    const report = buildParentReport(state, 'Sam', true)
    const line = formatParentSentence(report)
    expect(state.signBolted).toBe(false)
    expect(state.signPractice).toBe(true)
    expect(line.toLowerCase()).toContain('microphone off')
    expect(line.toLowerCase()).toContain('not assessed')
    expect(line.toLowerCase()).not.toContain('you read it')
    expect(line.toLowerCase()).not.toContain('fluent')
    expect(line.toLowerCase()).not.toContain('pronunciation was correct')
    const confirmed = formatParentSentence(confirmParentRead(report))
    expect(confirmed).toContain('Parent confirmed')
    expect(confirmed).toContain('not scored')
  })
})

describe('parent entry', () => {
  it('accepts the Pages-safe query, hash, and folder', () => {
    expect(isParentEntry('https://marvelus-tech.github.io/project-ideas/revedu/?parent=1')).toBe(true)
    expect(isParentEntry('https://marvelus-tech.github.io/project-ideas/revedu/#parent')).toBe(true)
    expect(isParentEntry('https://marvelus-tech.github.io/project-ideas/revedu/parent/')).toBe(true)
    expect(isParentEntry('https://marvelus-tech.github.io/project-ideas/revedu/')).toBe(false)
    expect(parentHref('https://marvelus-tech.github.io/project-ideas/revedu/pebble-crossing/?mic=off')).toBe(
      '/project-ideas/revedu/pebble-crossing/?mic=off&parent=1#parent',
    )
  })
})

function placeWord(state: ReturnType<typeof atPhonicsChoose>, tile: string) {
  const ready = state.beatStep === 'choose' && state.inputOpen ? state : sessionReducer(state, { type: 'HEAR_DONE' })
  let next = sessionReducer(ready, { type: 'PHONICS_TILE', tile })
  next = sessionReducer(next, { type: 'BLEND_DONE' })
  return sessionReducer(next, { type: 'PRODUCTION_DONE', attemptDetected: false })
}

describe('creek overlay flags', () => {
  it('sets data-world flags for each story beat and not for a repeated tap', () => {
    let state = atPhonicsChoose(0)
    expect(overlayFlags(state.world)).toEqual(['pip:idle:red'])
    state = placeWord(state, 'c')
    expect(overlayFlags(state.world)).toEqual(['kit:arrived', 'pip:idle:red'])
    state = placeWord(state, 's')
    expect(overlayFlags(state.world)).toEqual(['map:open', 'kit:sitting', 'pip:idle:red'])
    state = placeWord(state, 'sh')
    expect(overlayFlags(state.world)).toEqual(['map:open', 'ship:docked', 'kit:sitting', 'pip:idle:red'])
    state = placeWord(state, 'sh')
    expect(overlayFlags(state.world)).toEqual(['map:open', 'shop:open', 'ship:docked', 'kit:sitting', 'pip:idle:red'])
    state = placeWord(state, 'sh')
    expect(overlayFlags(state.world)).toEqual(['map:open', 'shop:open', 'shell:lifted', 'ship:docked', 'kit:sitting', 'pip:idle:red'])
    state = placeWord(state, 'sh')
    expect(overlayFlags(state.world)).toEqual(['map:open', 'shop:open', 'shell:lifted', 'ship:docked', 'rope:shore', 'fish:helped', 'kit:sitting', 'pip:idle:red'])
    state = sessionReducer(state, { type: 'HEAR_DONE' })
    state = sessionReducer(state, { type: 'RETRIEVAL_PICK', word: 'fish' })
    expect(overlayFlags(state.world)).toEqual(['map:open', 'shop:open', 'shell:lifted', 'ship:docked', 'rope:tight', 'fish:helped', 'kit:sitting', 'pip:idle:red'])
    state = sessionReducer({ ...state, phase: 'sentence' }, { type: 'SENTENCE_RESULT', quality: 'unclear' })
    expect(overlayFlags(state.world)).toEqual(['map:open', 'shop:open', 'shell:lifted', 'ship:docked', 'rope:tight', 'fish:helped', 'kit:aboard', 'pip:idle:red'])
    expect(overlayFlags(state.world, 'listen', 'leaf')).toContain('pip:listen:leaf')
  })
})

describe('math coaching', () => {
  it('does not replay the sh model after a math miss', () => {
    expect(missCoach('math', 'Eight plus two.').toLowerCase()).not.toContain('sh')
    expect(missCoach('math', 'Eight plus two.')).toContain('Eight plus two')
  })
})