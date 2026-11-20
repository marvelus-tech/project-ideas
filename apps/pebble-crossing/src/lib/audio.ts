let context: AudioContext | null = null

/** Resolves on end, error, or an application timer. Never waits for a missing browser callback. */
export function speak(text: string, timeoutMs = 4000): Promise<void> {
  return new Promise((resolve) => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      window.clearTimeout(timer)
      window.clearInterval(kick)
      resolve()
    }
    const timer = window.setTimeout(() => {
      try { window.speechSynthesis?.cancel() } catch { /* already stopped */ }
      finish()
    }, timeoutMs)
    if (!window.speechSynthesis) {
      finish()
      return
    }
    try { window.speechSynthesis.cancel() } catch { /* ignore */ }
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.onend = finish
    utterance.onerror = finish
    try { window.speechSynthesis.speak(utterance) } catch { finish() }
    const kick = window.setInterval(() => {
      try {
        if (window.speechSynthesis.paused) window.speechSynthesis.resume()
      } catch { /* ignore */ }
    }, 250)
  })
}

/** Isolated quiet-air model. This is filtered noise, not "shuh" from text-to-speech. */
export function playSh(): Promise<void> {
  const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtx) return Promise.resolve()
  try {
    context ??= new AudioCtx()
  } catch {
    return Promise.resolve()
  }
  const run = context
  const duration = 0.42
  const buffer = run.createBuffer(1, Math.floor(run.sampleRate * duration), run.sampleRate)
  const data = buffer.getChannelData(0)
  for (let index = 0; index < data.length; index += 1) {
    const envelope = Math.sin((index / data.length) * Math.PI)
    data[index] = (Math.random() * 2 - 1) * envelope * 0.28
  }
  return new Promise((resolve) => {
    const timer = window.setTimeout(resolve, 500)
    try {
      const source = run.createBufferSource()
      source.buffer = buffer
      const filter = run.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = 3200
      filter.Q.value = 0.8
      const gain = run.createGain()
      gain.gain.value = 0.45
      source.connect(filter).connect(gain).connect(run.destination)
      source.onended = () => {
        window.clearTimeout(timer)
        resolve()
      }
      source.start()
    } catch {
      window.clearTimeout(timer)
      resolve()
    }
  })
}