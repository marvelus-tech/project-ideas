import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { MATH_PROMPTS, PHONICS_PROMPTS, SENTENCE, SCARF_KEY } from '../content/level6'
import type { ScarfColor } from '../content/level6'
import { readPlaytestParams } from '../lib/params'
import { listenForSentenceOnce, speakLine, speakText } from '../lib/speech'
import {
  buildParentReport,
  createInitialSession,
  persistParentReport,
  piecesRemaining,
  sessionReducer,
} from '../session/level6Machine'
import type { SessionState } from '../session/types'

import { Bridge } from './Bridge'
import { TilePrompt } from './TilePrompt'
import './GameSession.css'

const SCARVES: ScarfColor[] = ['red', 'leaf', 'stone']

export function GameSession() {
  const { maxMinutes, micOff } = readPlaytestParams()
  const [state, dispatch] = useReducer(sessionReducer, undefined, createInitialSession)
  const [logoHold, setLogoHold] = useState(false)
  const holdTimer = useRef<number | null>(null)
  const childName = sessionStorage.getItem('pebble-crossing-child-name') ?? 'Sam'

  const persist = useCallback(
    (s: SessionState) => {
      persistParentReport(buildParentReport(s, childName))
    },
    [childName],
  )

  useEffect(() => {
    if (state.phase === 'level_complete' || state.phase === 'hard_done') {
      persist(state)
    }
  }, [state, persist])

  useEffect(() => {
  const capMs = maxMinutes * 60 * 1000
    const tick = () => {
      if (state.phase === 'hard_done' || state.phase === 'level_complete') return
      if (Date.now() - state.sessionStartedAt >= capMs) {
        dispatch({ type: 'TIME_CAP' })
      }
    }
    const id = window.setInterval(tick, 5000)
    return () => window.clearInterval(id)
  }, [maxMinutes, state.sessionStartedAt, state.phase])

  useEffect(() => {
    if (state.phase !== 'read_aloud') return
    let cancelled = false
    ;(async () => {
      await speakLine('read_your_turn')
      if (cancelled) return
      if (micOff) {
        await speakText(SENTENCE)
        await speakLine('read_abstain')
        dispatch({ type: 'READ_ALOUD_MIC_OFF' })
        return
      }
      const result = await listenForSentenceOnce()
      if (cancelled) return
      if (result === 'heard') {
        await speakLine('read_success')
        dispatch({ type: 'READ_ALOUD_SUCCESS' })
        return
      }
      await speakLine('read_retry')
      if (cancelled) return
      const retry = await listenForSentenceOnce()
      if (retry === 'heard') {
        await speakLine('read_success')
        dispatch({ type: 'READ_ALOUD_SUCCESS' })
        return
      }
      await speakText(SENTENCE)
      await speakLine('read_abstain')
      dispatch({ type: 'READ_ALOUD_FAIL' })
    })()
    return () => {
      cancelled = true
    }
  }, [state.phase, micOff])

  useEffect(() => {
    if (state.phase === 'intro') void speakLine('intro')
  }, [state.phase])

  const onScarf = (scarf: ScarfColor) => {
    sessionStorage.setItem(SCARF_KEY, scarf)
    dispatch({ type: 'PICK_SCARF', scarf })
  }

  const phonics = PHONICS_PROMPTS[state.phonicsIndex]
  const math = MATH_PROMPTS[state.mathIndex]
  const remaining = piecesRemaining(state)

  const logoDown = () => {
    holdTimer.current = window.setTimeout(() => setLogoHold(true), 900)
  }
  const logoUp = () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current)
    holdTimer.current = null
    if (!logoHold) return
    setLogoHold(false)
  }

  return (
    <main className="game">
      <header className="game-header">
        <button
          type="button"
          className="logo-btn"
          onPointerDown={logoDown}
          onPointerUp={logoUp}
          onPointerLeave={logoUp}
        >
          Pebble Crossing
        </button>
        {remaining > 0 && state.phase !== 'hard_done' && (
          <p className="pieces-left">{remaining} pieces to go</p>
        )}
        {logoHold && (
          <p className="logo-hold">
            <Link to="/parent">Parent report (hold)</Link>
          </p>
        )}
      </header>

      <Bridge
        planks={state.planks}
        posts={state.posts}
        signBolted={state.signBolted}
        signPractice={state.signPractice}
        pipWalkKey={state.pipWalkKey}
        scarf={state.scarf}
      />

      {state.phase === 'scarf' && (
        <section className="panel">
          <h2>Pick Pip&apos;s scarf once</h2>
          <ul className="scarf-row">
            {SCARVES.map((s) => (
              <li key={s}>
                <button type="button" className="big-btn" onClick={() => onScarf(s)}>
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {state.phase === 'intro' && (
        <section className="panel">
          <button
            type="button"
            className="plank-btn"
            onClick={() => dispatch({ type: 'INTRO_PLANK_TAPPED' })}
          >
            Tap the big plank
          </button>
        </section>
      )}

      {state.phase === 'teach_sh' && (
        <TeachShPanel
          step={state.teachShStep}
          onAdvance={() => dispatch({ type: 'TEACH_SH_ADVANCE' })}
        />
      )}

      {state.phase === 'phonics' && phonics && (
        <section className="panel">
          <p className="beat-title">Phonics</p>
          {state.promptMissCount < 2 ? (
            <TilePrompt
              tiles={phonics.tiles as unknown as (string | number)[]}
              correct={phonics.correctTile}
              wobble={state.wobble}
              modeled={false}
              label={`${phonics.word} — ${phonics.position === 'end' ? 'end sound' : 'start sound'}`}
              onPick={(tile) => dispatch({ type: 'PHONICS_TILE', tile: String(tile) })}
              onWobbleEnd={() => {
                dispatch({ type: 'CLEAR_WOBBLE' })
                void speakLine('phonics_listen_again')
              }}
            />
          ) : (
            <TilePrompt
              tiles={phonics.tiles as unknown as (string | number)[]}
              correct={phonics.correctTile}
              wobble={state.wobble}
              modeled
              label={phonics.word}
              onPick={(tile) => {
                if (String(tile) === phonics.correctTile) {
                  dispatch({ type: 'PHONICS_TILE', tile: String(tile) })
                } else {
                  dispatch({ type: 'PHONICS_TILE', tile: String(tile) })
                }
              }}
              onWobbleEnd={() => {
                dispatch({ type: 'CLEAR_WOBBLE' })
              }}
            />
          )}
        </section>
      )}

      {state.phase === 'math' && math && (
        <section className="panel">
          <p className="beat-title">Posts</p>
          <p className="math-expr">
            {math.expression}
            <span className="pebbles" aria-label="Pebbles">
              {math.pebbles[0]} · {math.pebbles[1]}
            </span>
          </p>
          <TilePrompt
            tiles={math.tiles}
            correct={math.correct}
            wobble={state.wobble}
            modeled={state.mathMissCount >= 2}
            label={math.voiceLine}
            onPick={(tile) => dispatch({ type: 'MATH_TILE', value: Number(tile) })}
            onWobbleEnd={() => {
              dispatch({ type: 'CLEAR_WOBBLE' })
              if (state.mathMissCount < 2) void speakLine('phonics_listen_again')
            }}
          />
        </section>
      )}

      {state.phase === 'read_aloud' && (
        <section className="panel">
          <p className="sign-preview">{SENTENCE}</p>
          <p className="read-wait">Listen, then read the sign aloud.</p>
        </section>
      )}

      {state.phase === 'level_complete' && (
        <section className="panel done-panel">
          <h2>Today&apos;s span is done.</h2>
          <p>The sh planks are on. Pip stepped across.</p>
          {state.planks.some((p) => p.kind === 'practice') && (
            <p className="practice-note">
              A practice plank is on for the one we did together. We can bolt it next time.
            </p>
          )}
          {state.timeCapHit && <p>Time for today — finishing with what is on the span.</p>}
          <button
            type="button"
            className="big-btn"
            onClick={() => {
              void speakLine('closed').then(() => dispatch({ type: 'LEVEL_COMPLETE_ACK' }))
            }}
          >
            Show a grown-up
          </button>
        </section>
      )}

      {state.phase === 'hard_done' && (
        <section className="panel done-panel">
          <h2>Pebble Crossing is closed for today.</h2>
          <button
            type="button"
            className="big-btn"
            onClick={() => {
              dispatch({ type: 'REPLAY_PIP' })
            }}
          >
            Show the span
          </button>
          <p className="child-safe">No next level here.</p>
        </section>
      )}
    </main>
  )
}

function TeachShPanel({
  step,
  onAdvance,
}: {
  step: SessionState['teachShStep']
  onAdvance: () => void
}) {
  useEffect(() => {
    if (step === 'sh_model') void speakLine('teach_sh_open')
    if (step === 'tap_sh') void speakLine('teach_sh_tap')
    if (step === 'word_a') void speakLine('teach_words')
    if (step === 'word_the') void speakLine('the_warning')
  }, [step])

  const labels: Record<string, string> = {
    sh_model: 'Listen: sh as in ship',
    tap_sh: 'Tap sh',
    word_a: 'Tap a (whole word)',
    word_the: 'Tap the (whole word)',
    done: 'Ready',
  }

  return (
    <section className="panel teach-panel">
      <p>{labels[step]}</p>
      {step === 'sh_model' && (
        <p className="word-mark">
          sh<span className="light">ip</span>
        </p>
      )}
      <button
        type="button"
        className="big-btn"
        onClick={() => {
          if (step === 'tap_sh') void speakLine('phonics_correct')
          onAdvance()
        }}
      >
        {step === 'tap_sh' ? 'sh' : 'Continue'}
      </button>
    </section>
  )
}