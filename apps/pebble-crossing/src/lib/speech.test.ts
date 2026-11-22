import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { runProductionTurn, runSentenceTurn } from '../session/speechTurn'
import { detectVoiceAttempt, listenForSentence, sentenceRecovery } from './speech'

type PebbleWindow = Window & { __pebbleSpeech?: { mode?: string; delay?: number } }

function win(): PebbleWindow {
  return globalThis as unknown as PebbleWindow
}

function stub(mode: string, delay = 0) {
  win().__pebbleSpeech = { mode, delay }
}

beforeEach(() => {
  vi.stubGlobal('window', globalThis)
  delete win().__pebbleSpeech
})

afterEach(() => {
  delete win().__pebbleSpeech
})

describe('detectVoiceAttempt', () => {
  it('honors abort before recognition starts', async () => {
    const ac = new AbortController()
    ac.abort()
    await expect(detectVoiceAttempt({ signal: ac.signal })).resolves.toBe('aborted')
  })

  it('reports attempt on match stub', async () => {
    stub('match', 0)
    await expect(detectVoiceAttempt({ preRollMs: 0 })).resolves.toBe('attempt_detected')
  })

  it('treats explicit silence stub as silence for retry path', async () => {
    stub('silence', 0)
    await expect(detectVoiceAttempt({ preRollMs: 0 })).resolves.toBe('silence')
    expect(sentenceRecovery('silence')).toBe('unclear')
  })
})

describe('listenForSentence', () => {
  it('maps timeout stub to mic_off recovery', async () => {
    stub('timeout', 5)
    await expect(listenForSentence({ preRollMs: 0, timeoutMs: 50 })).resolves.toBe('timeout')
    expect(sentenceRecovery('timeout')).toBe('mic_off')
  })
})

describe('runProductionTurn', () => {
  it('retries once after silence then finishes without attempt', async () => {
    stub('silence', 0)
    const setUi = vi.fn()
    const waitForTap = vi.fn(async () => {})
    const replayModel = vi.fn(async () => {})
    const attempt = await runProductionTurn(false, replayModel, { setUi, waitForTap })
    expect(attempt).toBe(false)
    expect(waitForTap).toHaveBeenCalledTimes(1)
    expect(replayModel).toHaveBeenCalledTimes(1)
    expect(setUi).toHaveBeenCalledWith('retry', expect.stringContaining('detect a voice'))
  })

  it('skips mic when micOff with pause only', async () => {
    vi.useFakeTimers()
    const setUi = vi.fn()
    const pending = runProductionTurn(true, async () => {}, { setUi, waitForTap: async () => {} })
    await vi.runAllTimersAsync()
    const attempt = await pending
    vi.useRealTimers()
    expect(attempt).toBe(false)
    expect(setUi).toHaveBeenCalledWith('listening', expect.stringContaining('microphone is off'))
  })
})

describe('runSentenceTurn', () => {
  it('waits for tap before listening', async () => {
    stub('match', 0)
    const waitForTap = vi.fn(async () => {})
    const setUi = vi.fn()
    const result = await runSentenceTurn(false, { setUi, waitForTap })
    expect(waitForTap).toHaveBeenCalledTimes(1)
    expect(result.quality).toBe('attempt')
    expect(setUi.mock.calls[0]?.[0]).toBe('ready')
  })
})