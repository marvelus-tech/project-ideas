import type { ScarfColor } from '../content/level6'

export type SessionPhase =
  | 'scarf'
  | 'intro'
  | 'teach_sh'
  | 'phonics'
  | 'math'
  | 'read_aloud'
  | 'level_complete'
  | 'hard_done'

export type TeachShStep = 'sh_model' | 'tap_sh' | 'word_a' | 'word_the' | 'done'

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

export interface PhonicsAttemptStats {
  promptId: string
  attempts: number
  firstTry: boolean
  helped: boolean
}

export interface MathAttemptStats {
  promptId: string
  attempts: number
  firstTry: boolean
  helped: boolean
}

export type SentenceOutcome =
  | 'read'
  | 'parent_confirmed'
  | 'not_yet_parent'
  | 'no_fluency_claim'

export interface ParentReportData {
  childName: string
  pattern: string
  shFirstTry: number
  shAttempts: number
  shHelped: number
  shReviewFirstTry: number
  shReviewAttempts: number
  mathFirstTry: number
  mathAttempts: number
  mathHelped: number
  sentenceOutcome: SentenceOutcome
  exactSentence: string
  practicePlankCount: number
  endedEarly: boolean
}

export interface SessionState {
  phase: SessionPhase
  scarf: ScarfColor | null
  teachShStep: TeachShStep
  phonicsIndex: number
  /** 0 = first try, 1 = after one miss (reset tiles), 2+ triggers helped */
  promptMissCount: number
  mathIndex: number
  mathMissCount: number
  planks: PlankRecord[]
  posts: PostRecord[]
  phonicsStats: PhonicsAttemptStats[]
  mathStats: MathAttemptStats[]
  signBolted: boolean
  signPractice: boolean
  sentenceOutcome: SentenceOutcome
  readAloudRetries: number
  wobble: boolean
  pipWalkKey: number
  consecutiveHelped: number
  sessionStartedAt: number
  timeCapHit: boolean
}

export type SessionAction =
  | { type: 'PICK_SCARF'; scarf: ScarfColor }
  | { type: 'INTRO_PLANK_TAPPED' }
  | { type: 'TEACH_SH_ADVANCE' }
  | { type: 'PHONICS_TILE'; tile: string }
  | { type: 'MATH_TILE'; value: number }
  | { type: 'READ_ALOUD_SUCCESS' }
  | { type: 'READ_ALOUD_FAIL' }
  | { type: 'READ_ALOUD_MIC_OFF' }
  | { type: 'LEVEL_COMPLETE_ACK' }
  | { type: 'HARD_DONE' }
  | { type: 'REPLAY_PIP' }
  | { type: 'TIME_CAP' }
  | { type: 'CLEAR_WOBBLE' }