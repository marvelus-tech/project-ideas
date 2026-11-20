import { PARENT_REPORT_KEY, PHONICS_PROMPTS, SENTENCE } from '../content/level6'
import type { ParentReportData, SessionState } from './types'

export function buildParentReport(
  state: SessionState,
  childName: string,
): ParentReportData {
  const shOnly = state.phonicsStats.filter((s) =>
    PHONICS_PROMPTS.find((p) => p.id === s.promptId && !p.isReview),
  )
  const review = state.phonicsStats.filter((s) =>
    PHONICS_PROMPTS.find((p) => p.id === s.promptId && p.isReview),
  )
  const mathFirstTry = state.mathStats.filter((s) => s.firstTry).length
  const mathAttempts = state.mathStats.reduce((n, s) => n + s.attempts, 0)
  const mathHelped = state.mathStats.filter((s) => s.helped).length

  return {
    childName,
    pattern: 'sh',
    shFirstTry: shOnly.filter((s) => s.firstTry).length,
    shAttempts: shOnly.reduce((n, s) => n + s.attempts, 0),
    shHelped: shOnly.filter((s) => s.helped).length,
    shReviewFirstTry: review.filter((s) => s.firstTry).length,
    shReviewAttempts: review.reduce((n, s) => n + s.attempts, 0),
    mathFirstTry,
    mathAttempts,
    mathHelped,
    sentenceOutcome: state.sentenceOutcome,
    exactSentence: SENTENCE,
    practicePlankCount: state.planks.filter((p) => p.kind === 'practice').length,
    endedEarly: state.timeCapHit || state.consecutiveHelped >= 3,
  }
}

export function persistParentReport(report: ParentReportData) {
  sessionStorage.setItem(PARENT_REPORT_KEY, JSON.stringify(report))
}

export function formatParentSentence(report: ParentReportData): string {
  const nSh = 4
  let patternResult: string
  if (report.endedEarly && report.shHelped >= 3) {
    patternResult =
      'sh was hard today. We stopped early and will bring it back. Slot not filled.'
  } else if (report.shHelped > 0 || report.shFirstTry < nSh) {
    patternResult = `sh was shaky (${report.shFirstTry} of ${report.shAttempts} first try, ${report.shHelped} helped). Slot not filled.`
  } else {
    patternResult = `sh was solid (${report.shFirstTry} of ${nSh} first try).`
  }

  let sentencePart: string
  switch (report.sentenceOutcome) {
    case 'read':
      sentencePart = `read "${report.exactSentence}"`
      break
    case 'parent_confirmed':
      sentencePart = `parent confirmed the read of "${report.exactSentence}."`
      break
    case 'not_yet_parent':
      sentencePart = 'not yet, parent was there.'
      break
    default:
      sentencePart =
        'we could not hear a clear read, so this is not a fluency claim.'
  }

  return `${report.childName}: ${patternResult} Math within 10: ${report.mathFirstTry} of ${report.mathAttempts} first try. Sentence: ${sentencePart}`
}