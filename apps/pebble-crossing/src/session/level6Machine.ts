import { MATH_PROMPTS, PHONICS_PROMPTS, type ScarfColor } from '../content/level6'
import type { SessionAction, SessionState } from './types'

export { buildParentReport, formatParentSentence, persistParentReport } from './sessionStats'

export function createInitialSession(now = Date.now()): SessionState {
  return {
    phase: 'scarf',
    scarf: null,
    teachShStep: 'sh_model',
    phonicsIndex: 0,
    promptMissCount: 0,
    mathIndex: 0,
    mathMissCount: 0,
    planks: [],
    posts: [],
    phonicsStats: [],
    mathStats: [],
    signBolted: false,
    signPractice: false,
    sentenceOutcome: 'no_fluency_claim',
    readAloudRetries: 0,
    wobble: false,
    pipWalkKey: 0,
    consecutiveHelped: 0,
    sessionStartedAt: now,
    timeCapHit: false,
  }
}

function recordPhonicsComplete(
  state: SessionState,
  promptId: string,
  attempts: number,
  firstTry: boolean,
  helped: boolean,
): SessionState {
  const stats = [
    ...state.phonicsStats,
    { promptId, attempts, firstTry, helped },
  ]
  const consecutiveHelped = helped ? state.consecutiveHelped + 1 : 0
  const nextIndex = state.phonicsIndex + 1
  if (consecutiveHelped >= 3) {
    return {
      ...state,
      phonicsStats: stats,
      consecutiveHelped,
      phase: 'level_complete',
    }
  }
  if (nextIndex >= PHONICS_PROMPTS.length) {
    return {
      ...state,
      phonicsStats: stats,
      consecutiveHelped,
      phonicsIndex: nextIndex,
      phase: 'math',
      mathIndex: 0,
      mathMissCount: 0,
    }
  }
  return {
    ...state,
    phonicsStats: stats,
    consecutiveHelped,
    phonicsIndex: nextIndex,
    promptMissCount: 0,
  }
}

function helpedPhonicsPlank(state: SessionState, promptId: string): SessionState {
  return recordPhonicsComplete(
    {
      ...state,
      planks: [...state.planks, { promptId, kind: 'practice' }],
      wobble: false,
    },
    promptId,
    state.promptMissCount + 1,
    false,
    true,
  )
}

function boltedPhonicsPlank(state: SessionState, promptId: string): SessionState {
  const attempts = state.promptMissCount + 1
  const firstTry = state.promptMissCount === 0
  return recordPhonicsComplete(
    {
      ...state,
      planks: [...state.planks, { promptId, kind: 'bolted' }],
      wobble: false,
    },
    promptId,
    attempts,
    firstTry,
    false,
  )
}

function recordMathComplete(
  state: SessionState,
  promptId: string,
  attempts: number,
  firstTry: boolean,
  helped: boolean,
  kind: 'bolted' | 'helped',
): SessionState {
  const stats = [
    ...state.mathStats,
    { promptId, attempts, firstTry, helped },
  ]
  const consecutiveHelped = helped ? state.consecutiveHelped + 1 : 0
  const nextIndex = state.mathIndex + 1
  const posts = [...state.posts, { promptId, kind }]
  if (consecutiveHelped >= 3) {
    return { ...state, mathStats: stats, posts, consecutiveHelped, phase: 'level_complete' }
  }
  if (nextIndex >= MATH_PROMPTS.length) {
    return {
      ...state,
      mathStats: stats,
      posts,
      consecutiveHelped,
      mathIndex: nextIndex,
      phase: 'read_aloud',
      readAloudRetries: 0,
    }
  }
  return {
    ...state,
    mathStats: stats,
    posts,
    consecutiveHelped,
    mathIndex: nextIndex,
    mathMissCount: 0,
  }
}

export function sessionReducer(
  state: SessionState,
  action: SessionAction,
): SessionState {
  switch (action.type) {
    case 'PICK_SCARF':
      return { ...state, scarf: action.scarf, phase: 'intro' }

    case 'INTRO_PLANK_TAPPED':
      return { ...state, phase: 'teach_sh', teachShStep: 'sh_model' }

    case 'TEACH_SH_ADVANCE': {
      const order = ['sh_model', 'tap_sh', 'word_a', 'word_the', 'done'] as const
      const idx = order.indexOf(state.teachShStep)
      const next = order[idx + 1] ?? 'done'
      if (next === 'done') {
        return { ...state, teachShStep: 'done', phase: 'phonics', phonicsIndex: 0, promptMissCount: 0 }
      }
      return { ...state, teachShStep: next }
    }

    case 'PHONICS_TILE': {
      if (state.phase !== 'phonics') return state
      const prompt = PHONICS_PROMPTS[state.phonicsIndex]
      if (!prompt) return state

      if (action.tile === prompt.correctTile) {
        if (state.promptMissCount >= 2) {
          return helpedPhonicsPlank(state, prompt.id)
        }
        return boltedPhonicsPlank(state, prompt.id)
      }

      // Wrong tap: wobble, never remove tiles (anti-cycling).
      const nextMiss = state.promptMissCount + 1
      if (nextMiss >= 2) {
        return { ...state, promptMissCount: 2, wobble: true }
      }
      return {
        ...state,
        promptMissCount: nextMiss,
        wobble: true,
      }
    }

    case 'MATH_TILE': {
      if (state.phase !== 'math') return state
      const prompt = MATH_PROMPTS[state.mathIndex]
      if (!prompt) return state

      if (action.value === prompt.correct) {
        if (state.mathMissCount >= 2) {
          return recordMathComplete(
            state,
            prompt.id,
            state.mathMissCount + 1,
            false,
            true,
            'helped',
          )
        }
        return recordMathComplete(
          state,
          prompt.id,
          state.mathMissCount + 1,
          state.mathMissCount === 0,
          false,
          'bolted',
        )
      }

      const nextMiss = state.mathMissCount + 1
      if (nextMiss >= 2) {
        return { ...state, mathMissCount: 2, wobble: true }
      }
      return { ...state, mathMissCount: nextMiss, wobble: true }
    }

    case 'READ_ALOUD_SUCCESS':
      return {
        ...state,
        signBolted: true,
        signPractice: false,
        sentenceOutcome: 'read',
        phase: 'level_complete',
      }

    case 'READ_ALOUD_FAIL':
      if (state.readAloudRetries < 1) {
        return { ...state, readAloudRetries: state.readAloudRetries + 1 }
      }
      return {
        ...state,
        signPractice: true,
        signBolted: false,
        sentenceOutcome: 'no_fluency_claim',
        phase: 'level_complete',
      }

    case 'READ_ALOUD_MIC_OFF':
      return {
        ...state,
        signPractice: true,
        signBolted: false,
        sentenceOutcome: 'no_fluency_claim',
        phase: 'level_complete',
      }

    case 'LEVEL_COMPLETE_ACK':
      return { ...state, phase: 'hard_done' }

    case 'HARD_DONE':
      return state

    case 'REPLAY_PIP':
      return { ...state, pipWalkKey: state.pipWalkKey + 1 }

    case 'TIME_CAP':
      return { ...state, timeCapHit: true, phase: 'level_complete' }

    case 'CLEAR_WOBBLE':
      return { ...state, wobble: false }

    default:
      return state
  }
}

/** After wobble + voice on second miss, child taps correct with model — practice plank only. */
export function phonicsModelTap(state: SessionState): SessionState {
  if (state.phase !== 'phonics' || state.promptMissCount < 2) return state
  const prompt = PHONICS_PROMPTS[state.phonicsIndex]
  if (!prompt) return state
  return helpedPhonicsPlank(state, prompt.id)
}

export function mathModelTap(state: SessionState): SessionState {
  if (state.phase !== 'math' || state.mathMissCount < 2) return state
  const prompt = MATH_PROMPTS[state.mathIndex]
  if (!prompt) return state
  return recordMathComplete(
    state,
    prompt.id,
    state.mathMissCount + 1,
    false,
    true,
    'helped',
  )
}

export function piecesRemaining(state: SessionState): number {
  const phonicsLeft = Math.max(0, PHONICS_PROMPTS.length - state.phonicsIndex)
  const mathLeft = state.phase === 'math' || state.phase === 'phonics'
    ? MATH_PROMPTS.length
    : Math.max(0, MATH_PROMPTS.length - state.mathIndex)
  const signLeft =
    state.phase === 'read_aloud' ||
    ['phonics', 'math', 'intro', 'teach_sh', 'scarf'].includes(state.phase)
      ? 1
      : 0
  if (state.phase === 'phonics') return phonicsLeft + MATH_PROMPTS.length + signLeft
  if (state.phase === 'math') return mathLeft + signLeft
  if (state.phase === 'read_aloud') return 1
  return 0
}

export function loadScarf(): ScarfColor | null {
  const v = sessionStorage.getItem('pebble-crossing-scarf')
  if (v === 'red' || v === 'leaf' || v === 'stone') return v
  return null
}