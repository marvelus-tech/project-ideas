import { SENTENCE } from '../content/level6'

const TARGET = SENTENCE.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/)

export type SentenceSignal = 'likely_words' | 'unclear'
export type ListenOutcome = SentenceSignal | 'denied' | 'silence' | 'unsupported' | 'timeout'
export type VoiceSignal = 'attempt_detected' | 'silence' | 'unsupported' | 'mic_off' | 'aborted'
export type SentenceQuality = 'mic_off' | 'attempt' | 'unclear'
export type LearningClaim = 'not_a_fluency_claim' | 'not_assessed'

export interface SpeechListenOptions {
  timeoutMs?: number
  preRollMs?: number
  signal?: AbortSignal
}

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

function normalizeListenOptions(options?: number | SpeechListenOptions): { timeoutMs: number; preRollMs: number; signal?: AbortSignal } {
  const base = typeof options === 'number' ? { timeoutMs: options } : options ?? {}
  return {
    timeoutMs: base.timeoutMs ?? 6000,
    preRollMs: base.preRollMs ?? 400,
    signal: base.signal,
  }
}

function listenAbort<T>(signal: AbortSignal, finish: (value: T) => void, aborted: T): () => void {
  if (signal.aborted) {
    finish(aborted)
    return () => { /* noop */ }
  }
  const onAbort = () => finish(aborted)
  signal.addEventListener('abort', onAbort, { once: true })
  return () => signal.removeEventListener('abort', onAbort)
}

export function detectVoiceAttempt(options?: number | SpeechListenOptions): Promise<VoiceSignal> {
  const { timeoutMs, preRollMs, signal } = normalizeListenOptions(options)
  if (signal?.aborted) return Promise.resolve('aborted')
  const mode = stubMode()
  if (mode === 'unsupported') return Promise.resolve('unsupported')
  if (mode === 'denied') return Promise.resolve('mic_off')
  if (mode === 'timeout') return waitSignal('silence', speechStub()?.delay ?? timeoutMs)
  if (mode === 'silence') return waitSignal('silence', speechStub()?.delay ?? 50)
  if (mode === 'match' || mode === 'attempt') return waitSignal('attempt_detected', speechStub()?.delay ?? 50)
  const Ctor = window.webkitSpeechRecognition ?? window.SpeechRecognition
  if (!Ctor) return Promise.resolve('unsupported')
  return new Promise((resolve) => {
    const recognition = new Ctor()
    let settled = false
    const finish = (value: VoiceSignal) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      window.clearTimeout(preRoll)
      detachAbort()
      try { recognition.abort() } catch { /* already stopped */ }
      resolve(value)
    }
    const detachAbort = signal ? listenAbort(signal, finish, 'aborted') : () => { /* noop */ }
    const timer = window.setTimeout(() => finish('silence'), timeoutMs + preRollMs)
    const preRoll = window.setTimeout(() => {
      if (settled || signal?.aborted) return
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'
      recognition.onresult = (event) => {
        const text = event.results[0]?.[0]?.transcript ?? ''
        if (text.trim()) finish('attempt_detected')
      }
      recognition.onerror = (event) => {
        const code = event?.error ?? ''
        if (code === 'not-allowed' || code === 'service-not-allowed') finish('mic_off')
        else if (code === 'no-speech') finish('silence')
        else if (code !== 'aborted') finish('silence')
      }
      recognition.onend = () => {
        if (!settled) finish('silence')
      }
      try { recognition.start() } catch { finish('unsupported') }
    }, preRollMs)
  })
}

export function listenForSentence(options?: number | SpeechListenOptions): Promise<ListenOutcome> {
  const { timeoutMs, preRollMs, signal } = normalizeListenOptions({
    ...(typeof options === 'number' ? { timeoutMs: options } : options),
    timeoutMs: (typeof options === 'number' ? options : options?.timeoutMs) ?? 12000,
  })
  if (signal?.aborted) return Promise.resolve('timeout')
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
      window.clearTimeout(preRoll)
      detachAbort()
      try { recognition.abort() } catch { /* already stopped */ }
      resolve(value)
    }
    const detachAbort = signal ? listenAbort(signal, finish, 'timeout') : () => { /* noop */ }
    const timer = window.setTimeout(() => finish('timeout'), timeoutMs + preRollMs)
    const preRoll = window.setTimeout(() => {
      if (settled || signal?.aborted) return
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'
      recognition.onresult = (event) => {
        const chunk = event.results[0]?.[0]
        const signalKind = classifySentence(chunk?.transcript ?? '', chunk?.confidence ?? 0.8)
        finish(signalKind === 'likely_words' ? 'likely_words' : 'unclear')
      }
      recognition.onerror = (event) => {
        const code = event?.error ?? ''
        if (code === 'not-allowed' || code === 'service-not-allowed') finish('denied')
        else if (code === 'no-speech') finish('silence')
        else if (code !== 'aborted') finish('timeout')
      }
      recognition.onend = () => {
        if (!settled) finish('silence')
      }
      try { recognition.start() } catch { finish('unsupported') }
    }, preRollMs)
  })
}

function waitSignal<T>(value: T, timeoutMs: number): Promise<T> {
  return new Promise((resolve) => window.setTimeout(() => resolve(value), timeoutMs))
}

export function pauseMs(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.resolve()
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      window.clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}