import { SENTENCE } from '../content/level6'

const VOICE_LINES: Record<string, string> = {
  intro:
    'You are the builder at Pebble Crossing. Pip will not cross until today\'s span is on. Tap the big plank.',
  teach_sh_open: 'Today\'s planks are sh. Listen. sh. sh as in ship.',
  teach_sh_tap: 'Tap sh while I say it again. sh.',
  teach_words:
    'Two small words, the whole word, not the sounds. This says a. This says the.',
  the_warning: 'the is a whole word. We are not learning th today.',
  phonics_listen_again: 'Listen again. sh.',
  phonics_model: 'This one is sh. Tap it with me.',
  phonics_correct: 'sh.',
  math_posts: 'Posts next.',
  read_your_turn: 'Your turn. Read the sign.',
  read_success: 'You read it.',
  read_retry: 'I did not hear it. Try once more.',
  read_abstain:
    'I am not sure I heard you. We will not tell a grown-up you read it unless we are sure.',
  done_span:
    'Today\'s span is done. The sh planks are on. Pip stepped across.',
  practice_plank_note:
    'A practice plank is on for the one we did together. We can bolt it next time.',
  closed: 'Pebble Crossing is closed for today. You can show a grown-up.',
  wobble: 'Listen again. sh.',
}

const speechQueue: { tail: Promise<void> } = { tail: Promise.resolve() }

export function speakLine(key: string, override?: string): Promise<void> {
  const text = override ?? VOICE_LINES[key] ?? key
  speechQueue.tail = speechQueue.tail.then(
    () =>
      new Promise<void>((resolve) => {
        if (!window.speechSynthesis) {
          resolve()
          return
        }
        window.speechSynthesis.cancel()
        const u = new SpeechSynthesisUtterance(text)
        u.rate = 0.92
        u.onend = () => resolve()
        u.onerror = () => resolve()
        window.speechSynthesis.speak(u)
      }),
  )
  return speechQueue.tail
}

export function speakText(text: string) {
  return speakLine(text, text)
}

export const voiceLineKeys = Object.keys(VOICE_LINES)

const TARGET_WORDS = SENTENCE.toLowerCase()
  .replace(/\./g, '')
  .split(/\s+/)

function transcriptMatches(transcript: string, minConfidence: number): boolean {
  const heard = transcript
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
  if (heard.length < 4) return false
  if (minConfidence > 0 && minConfidence < 0.55) return false
  let hi = 0
  for (const word of heard) {
    if (
      hi < TARGET_WORDS.length &&
      (word === TARGET_WORDS[hi] || word.startsWith(TARGET_WORDS[hi]))
    ) {
      hi++
    }
  }
  return hi >= TARGET_WORDS.length - 1
}

let listenActive = false

export function listenForSentenceOnce(): Promise<'heard' | 'unsure' | 'unsupported'> {
  const Ctor = window.webkitSpeechRecognition ?? window.SpeechRecognition
  if (!Ctor || listenActive) return Promise.resolve('unsupported')
  listenActive = true
  return new Promise((resolve) => {
    const rec = new Ctor()
    rec.continuous = false
    rec.interimResults = false
    rec.lang = 'en-US'
    let settled = false
    const finish = (v: 'heard' | 'unsure' | 'unsupported') => {
      if (settled) return
      settled = true
      listenActive = false
      try {
        rec.abort()
      } catch {
        /* ok */
      }
      resolve(v)
    }
    const timeout = window.setTimeout(() => finish('unsure'), 8000)
    rec.onresult = (ev) => {
      window.clearTimeout(timeout)
      const result = ev.results[0]?.[0]
      finish(transcriptMatches(result?.transcript ?? '', result?.confidence ?? 0.7) ? 'heard' : 'unsure')
    }
    rec.onerror = () => {
      window.clearTimeout(timeout)
      finish('unsure')
    }
    rec.onend = () => {
      window.clearTimeout(timeout)
      if (!settled) finish('unsure')
    }
    try {
      rec.start()
    } catch {
      finish('unsupported')
    }
  })
}