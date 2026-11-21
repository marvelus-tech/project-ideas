import { speak } from '../lib/audio'
import { SENTENCE } from '../content/level6'
import { detectVoiceAttempt, listenForSentence, pauseMs, sentenceRecovery, type ListenOutcome } from '../lib/speech'

export type SpeechTurnUi = 'idle' | 'ready' | 'listening' | 'retry' | 'done'
export type SentenceTurnUi = 'idle' | 'ready' | 'listening' | 'retry' | 'showContinue' | 'done'

export const PRODUCTION_READY = "Tap the mic when you're ready"
export const SENTENCE_READY = "Tap when you're ready to read"
export const LISTENING_STATUS = 'Listening for your voice.'
export const RETRY_VOICE = "I did not detect a voice. Let's try once together."
export const SENTENCE_RETRY = 'I could not use that as a reading check. Listen once, then read it with me.'

export interface TurnUiSink {
  setUi: (ui: SpeechTurnUi | SentenceTurnUi, status: string) => void
  waitForTap: () => Promise<void>
  signal?: AbortSignal
}

const LISTEN_MS = 6000
const SENTENCE_MS = 12000
const MIC_OFF_PAUSE_MS = 2000

/** Mouth step 1 and each phonics speak beat. */
export async function runProductionTurn(
  micOff: boolean,
  replayModel: () => Promise<void>,
  sink: TurnUiSink,
): Promise<boolean> {
  const { setUi, waitForTap, signal } = sink
  if (micOff) {
    setUi('listening', 'The microphone is off. You can still say it with me.')
    await pauseMs(MIC_OFF_PAUSE_MS, signal)
    setUi('done', '')
    return false
  }

  const listenOnce = async (): Promise<boolean> => {
    setUi('ready', PRODUCTION_READY)
    await waitForTap()
    if (signal?.aborted) return false
    setUi('listening', LISTENING_STATUS)
    const outcome = await detectVoiceAttempt({ timeoutMs: LISTEN_MS, signal })
    if (outcome === 'attempt_detected') {
      setUi('done', '')
      return true
    }
    if (outcome === 'aborted') return false
    return false
  }

  if (await listenOnce()) return true

  setUi('retry', RETRY_VOICE)
  await speak(RETRY_VOICE)
  await replayModel()
  if (signal?.aborted) return false
  setUi('listening', LISTENING_STATUS)
  const second = await detectVoiceAttempt({ timeoutMs: LISTEN_MS, signal })
  setUi('done', '')
  return second === 'attempt_detected'
}

export interface SentenceTurnResult {
  quality: 'mic_off' | 'attempt' | 'unclear'
  showContinueAfterFirst: boolean
}

export async function runSentenceTurn(micOff: boolean, sink: TurnUiSink): Promise<SentenceTurnResult> {
  const { setUi, waitForTap, signal } = sink
  if (micOff) {
    setUi('listening', 'The microphone is off. You can still read with me.')
    await pauseMs(MIC_OFF_PAUSE_MS, signal)
    setUi('done', '')
    return { quality: 'mic_off', showContinueAfterFirst: false }
  }

  const readWindow = async (): Promise<ListenOutcome | 'aborted'> => {
    setUi('ready', SENTENCE_READY)
    await waitForTap()
    if (signal?.aborted) return 'aborted'
    setUi('listening', LISTENING_STATUS)
    const outcome = await listenForSentence({ timeoutMs: SENTENCE_MS, signal })
    if (signal?.aborted) return 'aborted'
    return outcome
  }

  const first = await readWindow()
  if (first === 'aborted') return { quality: 'mic_off', showContinueAfterFirst: true }
  if (first === 'likely_words') {
    setUi('done', '')
    return { quality: 'attempt', showContinueAfterFirst: false }
  }

  setUi('showContinue', LISTENING_STATUS)
  setUi('retry', SENTENCE_RETRY)
  await speak(SENTENCE_RETRY)
  await speak(SENTENCE)
  if (signal?.aborted) return { quality: 'mic_off', showContinueAfterFirst: true }

  setUi('listening', LISTENING_STATUS)
  const second = await listenForSentence({ timeoutMs: SENTENCE_MS, signal })
  setUi('done', '')
  return { quality: sentenceRecovery(second), showContinueAfterFirst: true }
}