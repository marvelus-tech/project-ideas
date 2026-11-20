interface Window {
  webkitSpeechRecognition?: new () => SpeechRecognitionInstance
  SpeechRecognition?: new () => SpeechRecognitionInstance
}

interface SpeechRecognitionInstance {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

interface SpeechRecognitionEventLike {
  results: {
    [i: number]: {
      [j: number]: { transcript: string; confidence?: number }
    }
  }
}