import {
  MATH_PROMPTS,
  PHONICS_PROMPTS,
  RETRIEVAL_ANSWER,
  type ScarfColor,
} from '../content/level6'
import type { PlankKind, SessionAction, SessionState, WorldState } from './types'

export { buildParentReport, confirmParentRead, formatParentSentence, persistParentReport } from './sessionStats'

export const EMPTY_WORLD: WorldState = {
  kit: 'hidden',
  map: 'folded',
  ship: 'away',
  shop: 'closed',
  shell: 'hidden',
  rope: 'creek',
  fish: 'hidden',
}

export function createInitialSession(now = Date.now()): SessionState {
  return {
    phase: 'scarf',
    scarf: null,
    beatStep: 'hear',
    mouthStep: 0,
    wholeWordStep: 0,
    phonicsIndex: 0,
    promptMissCount: 0,
    modeled: false,
    inputOpen: false,
    shuffleSeed: 1,
    pendingKind: null,
    pendingFirstTry: false,
    mathIndex: 0,
    mathMissCount: 0,
    planks: [],
    posts: [],
    phonicsStats: [],
    mathStats: [],
    retrievalKind: null,
    world: EMPTY_WORLD,
    signBolted: false,
    signPractice: false,
    sentenceOutcome: 'unconfirmed',
    productionPrompts: 0,
    voiceAttempts: 0,
    wobble: false,
    pipWalkKey: 0,
    consecutiveHelped: 0,
    sessionStartedAt: now,
    timeCapHit: false,
  }
}

export function atPhonicsChoose(index: number, seed = 3): SessionState {
  return {
    ...createInitialSession(0),
    phase: 'phonics',
    phonicsIndex: index,
    beatStep: 'choose',
    inputOpen: true,
    shuffleSeed: seed,
  }
}

export function shuffleWithSeed<T>(items: readonly T[], seed: number): T[] {
  const copy = [...items]
  let value = seed + 17
  for (let index = copy.length - 1; index > 0; index -= 1) {
    value = (value * 16807 + 11) % 2147483647
    const swap = value % (index + 1)
    const current = copy[index]!
    copy[index] = copy[swap]!
    copy[swap] = current
  }
  return copy
}

function applyWord(world: WorldState, id: string): WorldState {
  switch (id) {
    case 'cat':
      return { ...world, kit: 'arrived' }
    case 'sat':
      return { ...world, kit: 'sitting', map: 'open' }
    case 'ship':
      return { ...world, ship: 'docked' }
    case 'shop':
      return { ...world, shop: 'open' }
    case 'shell':
      return { ...world, shell: 'lifted' }
    case 'fish':
      return { ...world, fish: 'helped', rope: 'shore' }
    default:
      return world
  }
}

function finishEarly(state: SessionState): boolean {
  return state.consecutiveHelped >= 3
}

function commitPhonics(state: SessionState): SessionState {
  const prompt = PHONICS_PROMPTS[state.phonicsIndex]
  if (!prompt || !state.pendingKind) return state
  const helped = state.pendingKind === 'practice'
  const stats = [
    ...state.phonicsStats,
    {
      promptId: prompt.id,
      attempts: state.promptMissCount + 1,
      firstTry: state.pendingFirstTry,
      helped,
    },
  ]
  const consecutiveHelped = helped ? state.consecutiveHelped + 1 : 0
  const next: SessionState = {
    ...state,
    planks: [...state.planks, { promptId: prompt.id, kind: state.pendingKind }],
    phonicsStats: stats,
    world: applyWord(state.world, prompt.id),
    consecutiveHelped,
    pendingKind: null,
    pendingFirstTry: false,
    modeled: false,
    promptMissCount: 0,
    wobble: false,
    inputOpen: false,
  }
  if (finishEarly(next)) return { ...next, phase: 'level_complete', beatStep: 'hear' }
  if (state.phonicsIndex + 1 >= PHONICS_PROMPTS.length) {
    return { ...next, phase: 'retrieval', beatStep: 'hear', phonicsIndex: state.phonicsIndex + 1 }
  }
  return {
    ...next,
    phonicsIndex: state.phonicsIndex + 1,
    phase: 'phonics',
    beatStep: 'hear',
    shuffleSeed: state.shuffleSeed + 1,
  }
}

function goWholeWords(state: SessionState): SessionState {
  return { ...state, phase: 'whole_words', wholeWordStep: 0, beatStep: 'choose', inputOpen: true, wobble: false }
}

function goMath(state: SessionState): SessionState {
  return { ...state, phase: 'math', mathIndex: 0, mathMissCount: 0, modeled: false, inputOpen: true, beatStep: 'choose' }
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'PICK_SCARF':
      return { ...state, scarf: action.scarf, phase: 'need' }
    case 'START_SPAN':
      return { ...state, phase: 'mouth', mouthStep: 0, beatStep: 'hear' }
    case 'MOUTH_ADVANCE': {
      const voiceAttempts = state.voiceAttempts + (action.attemptDetected ? 1 : 0)
      const productionPrompts = state.productionPrompts + (state.mouthStep === 1 ? 1 : 0)
      if (state.mouthStep === 0) {
        return { ...state, mouthStep: 1, beatStep: 'speak', voiceAttempts, productionPrompts }
      }
      return {
        ...state,
        voiceAttempts,
        productionPrompts,
        phase: 'phonics',
        phonicsIndex: 0,
        beatStep: 'hear',
        inputOpen: false,
      }
    }
    case 'HEAR_DONE':
      if (state.phase === 'phonics' && state.beatStep === 'hear') {
        return { ...state, beatStep: 'choose', inputOpen: true }
      }
      if (state.phase === 'retrieval' && state.beatStep === 'hear') {
        return { ...state, beatStep: 'choose', inputOpen: true }
      }
      return state
    case 'PHONICS_TILE': {
      if (state.phase !== 'phonics' || state.beatStep !== 'choose' || !state.inputOpen) return state
      const prompt = PHONICS_PROMPTS[state.phonicsIndex]
      if (!prompt) return state
      if (action.tile === prompt.correctTile) {
        // A repeated tap after any miss is supported work, even before the model highlight.
        const supported = state.modeled || state.promptMissCount > 0
        return {
          ...state,
          inputOpen: false,
          pendingKind: supported ? 'practice' : 'bolted',
          pendingFirstTry: !supported,
          beatStep: 'blend',
          wobble: false,
        }
      }
      const misses = state.promptMissCount + 1
      return {
        ...state,
        promptMissCount: misses,
        modeled: misses >= 2,
        inputOpen: false,
        wobble: true,
        shuffleSeed: state.shuffleSeed + 1,
        pendingKind: null,
      }
    }
    case 'BLEND_DONE':
      return state.beatStep === 'blend' ? { ...state, beatStep: 'speak' } : state
    case 'PRODUCTION_DONE':
      if (state.beatStep !== 'speak' || state.phase !== 'phonics') return state
      return commitPhonics({
        ...state,
        productionPrompts: state.productionPrompts + 1,
        voiceAttempts: state.voiceAttempts + (action.attemptDetected ? 1 : 0),
      })
    case 'RETRIEVAL_PICK': {
      if (state.phase !== 'retrieval' || state.beatStep !== 'choose' || !state.inputOpen) return state
      if (action.word === RETRIEVAL_ANSWER) {
        const consecutiveHelped = 0
        const next = {
          ...state,
          retrievalKind: 'bolted' as PlankKind,
          world: { ...state.world, rope: 'tight' as const },
          consecutiveHelped,
          inputOpen: false,
        }
        return goMath(next)
      }
      return { ...state, beatStep: 'model', modeled: true, inputOpen: false, wobble: true }
    }
    case 'RETRIEVAL_MODEL_DONE': {
      if (state.phase !== 'retrieval') return state
      const consecutiveHelped = state.consecutiveHelped + 1
      const next: SessionState = {
        ...state,
        retrievalKind: 'practice',
        world: { ...state.world, rope: 'tight' },
        consecutiveHelped,
        modeled: true,
        inputOpen: false,
        wobble: false,
      }
      return finishEarly(next) ? { ...next, phase: 'level_complete' } : goMath(next)
    }
    case 'WHOLE_WORD_ADVANCE': {
      if (state.phase !== 'whole_words') return state
      if (state.wholeWordStep === 0) return { ...state, wholeWordStep: 1 }
      return { ...state, phase: 'sentence', beatStep: 'speak', inputOpen: false }
    }
    case 'MATH_TILE': {
      if (state.phase !== 'math' || !state.inputOpen) return state
      const prompt = MATH_PROMPTS[state.mathIndex]
      if (!prompt) return state
      if (action.value === prompt.correct) {
        const helped = state.modeled || state.mathMissCount > 0
        const stats = [
          ...state.mathStats,
          {
            promptId: prompt.id,
            attempts: state.mathMissCount + 1,
            firstTry: !helped && state.mathMissCount === 0,
            helped,
          },
        ]
        const consecutiveHelped = helped ? state.consecutiveHelped + 1 : 0
        const posts = [
          ...state.posts,
          { promptId: prompt.id, kind: helped ? 'helped' as const : 'bolted' as const },
        ]
        const next: SessionState = {
          ...state,
          mathStats: stats,
          posts,
          consecutiveHelped,
          modeled: false,
          mathMissCount: 0,
          wobble: false,
        }
        if (finishEarly(next)) return { ...next, phase: 'level_complete' }
        if (state.mathIndex + 1 >= MATH_PROMPTS.length) return goWholeWords(next)
        return { ...next, mathIndex: state.mathIndex + 1, inputOpen: true }
      }
      const misses = state.mathMissCount + 1
      return {
        ...state,
        mathMissCount: misses,
        modeled: misses >= 2,
        inputOpen: false,
        wobble: true,
        shuffleSeed: state.shuffleSeed + 1,
      }
    }
    case 'SENTENCE_RESULT': {
      if (state.phase !== 'sentence') return state
      const micOff = action.quality === 'mic_off'
      return {
        ...state,
        phase: 'level_complete',
        signBolted: false,
        signPractice: true,
        sentenceOutcome: micOff ? 'mic_off_not_assessed' : action.quality === 'attempt' ? 'attempt_not_fluency' : 'unconfirmed',
        world: { ...state.world, kit: 'aboard', ship: 'docked' },
        productionPrompts: state.productionPrompts + 1,
      }
    }
    case 'PARENT_CONFIRMS_READ':
      return { ...state, sentenceOutcome: 'parent_confirmed', signBolted: true, signPractice: false }
    case 'PARENT_DECLINES_READ':
      return { ...state, sentenceOutcome: 'not_yet_parent', signBolted: false, signPractice: true }
    case 'LEVEL_COMPLETE_ACK':
      return { ...state, phase: 'hard_done' }
    case 'REPLAY_PIP':
      return { ...state, pipWalkKey: state.pipWalkKey + 1 }
    case 'TIME_CAP':
      if (state.phase === 'hard_done' || state.phase === 'level_complete') return state
      return { ...state, timeCapHit: true, phase: 'level_complete' }
    case 'CLEAR_WOBBLE':
      return { ...state, wobble: false }
    case 'RESUME_INPUT':
      if (state.beatStep === 'model') return state
      return { ...state, inputOpen: true, wobble: false }
    default:
      return state
  }
}

export function piecesRemaining(state: SessionState): number {
  if (state.phase === 'level_complete' || state.phase === 'hard_done') return 0
  const planksLeft = Math.max(0, PHONICS_PROMPTS.length - state.planks.length)
  const retrievalLeft = state.retrievalKind || state.world.rope === 'tight' ? 0 : 1
  const postsLeft = Math.max(0, MATH_PROMPTS.length - state.posts.length)
  const signLeft = state.signPractice || state.signBolted ? 0 : 1
  return planksLeft + retrievalLeft + postsLeft + signLeft
}

export function loadScarf(): ScarfColor | null {
  const value = sessionStorage.getItem('pebble-crossing-scarf')
  if (value === 'red' || value === 'leaf' || value === 'stone') return value
  return null
}