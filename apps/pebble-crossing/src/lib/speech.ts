import { SENTENCE } from '../content/level6'

const TARGET = SENTENCE.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/)

export type SentenceSignal = 'likely_words' | 'unclear'
export type ListenOutcome = SentenceSignal | 'denied' | 'silence' | 'unsupported' | 'timeout'
export type VoiceSignal = 'attempt_detected' | 'silence' | 'unsupported' | 'mic_off'
export type SentenceQuality = 'mic_off' | 'attempt' | 'unclear'
export type LearningClaim = 'not_a_fluency_claim' | 'not_assessed'

export function classifySentence(transcript: string, confidence = 0): SentenceSignal {
  if (confidence < 0.75) return 'unclear'
  const heard = transcript.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean)
  let index = 0
  for (const word of heard) {
    if (word === TARGET[index]) index += 1
    if (index === TARGET.length) return 'likely_words'
  }
  return 'unclear'
}

export function sentenceClaim(_signal: SentenceSignal | VoiceSignal): LearningClaim {
  return 'not_a_fluency_claim'
}

export function pronunciationClaim(): 'not_assessed' {
  return 'not_assessed'
}

/** Denial, a missing API, and a dead recognizer finish without another speech callback. */
export function sentenceRecovery(outcome: ListenOutcome | 'mic_off'): SentenceQuality {
  if (outcome === 'mic_off' || outcome === 'denied' || outcome === 'unsupported' || outcome === 'timeout') return 'mic_off'
  if (outcome === 'likely_words') return 'attempt'
  return 'unclear'
}

function speechStub(): { mode?: string; delay?: number } | null {
  return (window as unknown as { __pebbleSpeech?: { mode?: string; delay?: number } }).__pebbleSpeech ?? null
}

function stubMode(): string | null {
  return speechStub()?.mode ?? null
}

export function detectVoiceAttempt(timeoutMs = 2200): Promise<VoiceSignal> {
  const mode = stubMode()
  if (mode === 'unsupported') return Promise.resolve('unsupported')
  if (mode === 'denied') return Promise.resolve('mic_off')
  if (mode === 'timeout') return waitSignal('silence', speechStub()?.delay ?? timeoutMs)
  const Ctor = window.webkitSpeechRecognition ?? window.SpeechRecognition
  if (!Ctor) return Promise.resolve('unsupported')
  return new Promise((resolve) => {
    const recognition = new Ctor()
    let settled = false
    const finish = (value: VoiceSignal) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      try { recognition.abort() } catch { /* already stopped */ }
      resolve(value)
    }
    const timer = window.setTimeout(() => finish('silence'), timeoutMs)
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript ?? ''
      if (text.trim()) finish('attempt_detected')
    }
    recognition.onerror = (event) => {
      finish(event?.error === 'not-allowed' || event?.error === 'service-not-allowed' ? 'mic_off' : 'silence')
    }
    try { recognition.start() } catch { finish('unsupported') }
  })
}

export function listenForSentence(timeoutMs = 4000): Promise<ListenOutcome> {
  const mode = stubMode()
  if (mode === 'unsupported') return Promise.resolve('unsupported')
  if (mode === 'denied') return Promise.resolve('denied')
  if (mode === 'silence') return Promise.resolve('silence')
  if (mode === 'mismatch') return Promise.resolve('unclear')
  if (mode === 'match') return Promise.resolve('likely_words')
  if (mode === 'timeout') return waitSignal('timeout', speechStub()?.delay ?? timeoutMs)
  const Ctor = window.webkitSpeechRecognition ?? window.SpeechRecognition
  if (!Ctor) return Promise.resolve('unsupported')
  return new Promise((resolve) => {
    const recognition = new Ctor()
    let settled = false
    const finish = (value: ListenOutcome) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      try { recognition.abort() } catch { /* already stopped */ }
      resolve(value)
    }
    const timer = window.setTimeout(() => finish('timeout'), timeoutMs)
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognition.onresult = (event) => {
      const result = event.results[0]?.[0]
      const signal = classifySentence(result?.transcript ?? '', result?.confidence ?? 0.8)
      finish(signal === 'likely_words' ? 'likely_words' : 'unclear')
    }
    recognition.onerror = (event) => {
      const code = event?.error ?? ''
      if (code === 'not-allowed' || code === 'service-not-allowed') finish('denied')
      else if (code === 'no-speech') finish('silence')
      else if (code !== 'aborted') finish('timeout')
    }
    try { recognition.start() } catch { finish('unsupported') }
  })
}

function waitSignal<T>(value: T, timeoutMs: number): Promise<T> {
  return new Promise((resolve) => window.setTimeout(() => resolve(value), timeoutMs))
}