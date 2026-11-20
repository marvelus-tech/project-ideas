import type { ScarfColor } from '../content/level6'

export type SessionPhase =
  | 'scarf'
  | 'need'
  | 'mouth'
  | 'phonics'
  | 'retrieval'
  | 'whole_words'
  | 'math'
  | 'sentence'
  | 'level_complete'
  | 'hard_done'

export type BeatStep = 'hear' | 'choose' | 'blend' | 'speak' | 'model'
export type PlankKind = 'bolted' | 'practice'
export type PostKind = 'bolted' | 'helped'

export interface PlankRecord {
  promptId: string
  kind: PlankKind
}

export interface PostRecord {
  promptId: string
  kind: PostKind
}

export interface AttemptStats {
  promptId: string
  attempts: number
  firstTry: boolean
  helped: boolean
}

/** Machine signals only. None of these means pronunciation or fluency mastery. */
export type SentenceOutcome =
  | 'unconfirmed'
  | 'attempt_not_fluency'
  | 'mic_off_not_assessed'
  | 'parent_confirmed'
  | 'not_yet_parent'

export interface WorldState {
  kit: 'hidden' | 'arrived' | 'sitting' | 'aboard'
  map: 'folded' | 'open'
  ship: 'away' | 'docked'
  shop: 'closed' | 'open'
  shell: 'hidden' | 'lifted'
  rope: 'creek' | 'shore' | 'tight'
  fish: 'hidden' | 'helped'
}

export interface ParentReportData {
  childName: string
  pattern: string
  shFirstTry: number
  shAttempts: number
  shHelped: number
  shReviewFirstTry: number
  shReviewAttempts: number
  fishIndependent: boolean
  retrievalIndependent: boolean
  productionPrompts: number
  voiceAttempts: number
  micOff: boolean
  mathFirstTry: number
  mathAttempts: number
  mathHelped: number
  sentenceOutcome: SentenceOutcome
  exactSentence: string
  practicePlankCount: number
  endedEarly: boolean
  pronunciationAssessed: false
}

export interface SessionState {
  phase: SessionPhase
  scarf: ScarfColor | null
  beatStep: BeatStep
  mouthStep: 0 | 1
  wholeWordStep: 0 | 1
  phonicsIndex: number
  promptMissCount: number
  modeled: boolean
  inputOpen: boolean
  shuffleSeed: number
  pendingKind: PlankKind | null
  pendingFirstTry: boolean
  mathIndex: number
  mathMissCount: number
  planks: PlankRecord[]
  posts: PostRecord[]
  phonicsStats: AttemptStats[]
  mathStats: AttemptStats[]
  retrievalKind: PlankKind | null
  world: WorldState
  signBolted: boolean
  signPractice: boolean
  sentenceOutcome: SentenceOutcome
  productionPrompts: number
  voiceAttempts: number
  wobble: boolean
  pipWalkKey: number
  consecutiveHelped: number
  sessionStartedAt: number
  timeCapHit: boolean
}

export type SessionAction =
  | { type: 'PICK_SCARF'; scarf: ScarfColor }
  | { type: 'START_SPAN' }
  | { type: 'MOUTH_ADVANCE'; attemptDetected?: boolean }
  | { type: 'HEAR_DONE' }
  | { type: 'PHONICS_TILE'; tile: string }
  | { type: 'BLEND_DONE' }
  | { type: 'PRODUCTION_DONE'; attemptDetected: boolean }
  | { type: 'RETRIEVAL_PICK'; word: string }
  | { type: 'RETRIEVAL_MODEL_DONE' }
  | { type: 'WHOLE_WORD_ADVANCE' }
  | { type: 'MATH_TILE'; value: number }
  | { type: 'SENTENCE_RESULT'; quality: 'mic_off' | 'attempt' | 'unclear' }
  | { type: 'PARENT_CONFIRMS_READ' }
  | { type: 'PARENT_DECLINES_READ' }
  | { type: 'LEVEL_COMPLETE_ACK' }
  | { type: 'REPLAY_PIP' }
  | { type: 'TIME_CAP' }
  | { type: 'CLEAR_WOBBLE' }
  | { type: 'RESUME_INPUT' }