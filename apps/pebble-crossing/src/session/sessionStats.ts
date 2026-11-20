import { PARENT_REPORT_KEY, PHONICS_PROMPTS, SENTENCE } from '../content/level6'
import type { ParentReportData, SessionState } from './types'

export function buildParentReport(
  state: SessionState,
  childName: string,
  micOff = false,
): ParentReportData {
  const shOnly = state.phonicsStats.filter((item) =>
    PHONICS_PROMPTS.find((prompt) => prompt.id === item.promptId && !prompt.isReview),
  )
  const review = state.phonicsStats.filter((item) =>
    PHONICS_PROMPTS.find((prompt) => prompt.id === item.promptId && prompt.isReview),
  )
  return {
    childName,
    pattern: 'sh',
    shFirstTry: shOnly.filter((item) => item.firstTry).length,
    shAttempts: shOnly.reduce((sum, item) => sum + item.attempts, 0),
    shHelped: shOnly.filter((item) => item.helped).length,
    shReviewFirstTry: review.filter((item) => item.firstTry).length,
    shReviewAttempts: review.reduce((sum, item) => sum + item.attempts, 0),
    fishIndependent: shOnly.some((item) => item.promptId === 'fish' && item.firstTry),
    retrievalIndependent: state.retrievalKind === 'bolted',
    productionPrompts: state.productionPrompts,
    voiceAttempts: state.voiceAttempts,
    micOff,
    mathFirstTry: state.mathStats.filter((item) => item.firstTry).length,
    mathAttempts: state.mathStats.reduce((sum, item) => sum + item.attempts, 0),
    mathHelped: state.mathStats.filter((item) => item.helped).length,
    sentenceOutcome: state.sentenceOutcome,
    exactSentence: SENTENCE,
    practicePlankCount: state.planks.filter((plank) => plank.kind === 'practice').length,
    endedEarly: state.timeCapHit || state.consecutiveHelped >= 3,
    pronunciationAssessed: false,
  }
}

export function confirmParentRead(report: ParentReportData): ParentReportData {
  return { ...report, sentenceOutcome: 'parent_confirmed', pronunciationAssessed: false }
}

export function persistParentReport(report: ParentReportData) {
  sessionStorage.setItem(PARENT_REPORT_KEY, JSON.stringify(report))
}

export function formatParentSentence(report: ParentReportData): string {
  const pattern = report.endedEarly && report.shHelped >= 3
    ? 'sh was hard today. We stopped early and will bring it back. Slot not filled.'
    : report.shHelped > 0
      ? `sh connected with ${report.shFirstTry} of 4 words independently; ${report.shHelped} supported. The sh slot stays open.`
      : `sh connected with ${report.shFirstTry} of 4 words independently.`
  const fish = report.fishIndependent ? ' The end sound in fish was independent.' : ''
  const math = `Math within 10: ${report.mathFirstTry} of ${Math.max(report.mathAttempts, report.mathFirstTry)} first try.`
  let speech: string
  if (report.sentenceOutcome === 'parent_confirmed') {
    speech = `Parent confirmed the read of "${report.exactSentence}." Pronunciation was practiced, not scored.`
  } else if (report.micOff || report.sentenceOutcome === 'mic_off_not_assessed') {
    speech = `Speaking turns and "${report.exactSentence}" were practiced with the microphone off; speech was not assessed.`
  } else if (report.sentenceOutcome === 'not_yet_parent') {
    speech = 'Sentence: not yet, parent was there. Pronunciation was not assessed.'
  } else {
    const heard = report.voiceAttempts > 0 ? ' and voice attempts were detected' : ''
    speech = `${report.productionPrompts} speaking turns were prompted${heard}; pronunciation was not assessed. Sentence attempt is not a fluency claim.`
  }
  return `${report.childName}: ${pattern}${fish} ${math} ${speech}`
}