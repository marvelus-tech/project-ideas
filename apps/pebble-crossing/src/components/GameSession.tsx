import { useEffect, useReducer, useRef } from 'react'

import { MATH_PROMPTS, MOUTH_LINE, PHONICS_PROMPTS, RETRIEVAL_WORDS, SCARF_KEY, SENTENCE, missCoach } from '../content/level6'
import type { ScarfColor } from '../content/level6'
import { playSh, speak } from '../lib/audio'
import { readPlaytestParams } from '../lib/params'
import { detectVoiceAttempt, listenForSentence, sentenceRecovery } from '../lib/speech'
import { piecesRemaining, sessionReducer, shuffleWithSeed } from '../session/level6Machine'
import { previewSession } from '../session/preview'
import { buildParentReport, persistParentReport } from '../session/sessionStats'
import type { SessionState } from '../session/types'
import { CreekStage } from '../world/CreekStage'
import './GameSession.css'

const SCARVES: ScarfColor[] = ['red', 'leaf', 'stone']

export function GameSession({ onParent, suspended = false }: { onParent: () => void; suspended?: boolean }) {
  const params = new URLSearchParams(window.location.search)
  const { maxMinutes, micOff } = readPlaytestParams()
  const [state, dispatch] = useReducer(sessionReducer, params.get('scene'), previewSession)
  const played = useRef('')
  const childName = window.sessionStorage.getItem('pebble-crossing-child-name') ?? 'Sam'

  useEffect(() => {
    persistParentReport(buildParentReport(state, childName, micOff))
  }, [state, childName, micOff])

  useEffect(() => {
    const capMs = maxMinutes * 60 * 1000
    const id = window.setInterval(() => {
      if (Date.now() - state.sessionStartedAt >= capMs) dispatch({ type: 'TIME_CAP' })
    }, 5000)
    return () => window.clearInterval(id)
  }, [maxMinutes, state.sessionStartedAt])

  useEffect(() => {
    if (!state.wobble) return
    const id = window.setTimeout(() => {
      dispatch({ type: 'CLEAR_WOBBLE' })
      dispatch({ type: 'RESUME_INPUT' })
    }, 650)
    return () => window.clearTimeout(id)
  }, [state.wobble, state.shuffleSeed])

  useEffect(() => {
    if (suspended) return
    const prompt = PHONICS_PROMPTS[state.phonicsIndex]
    const key = [state.phase, state.phonicsIndex, state.beatStep, state.mouthStep, state.mathIndex, state.wholeWordStep].join(':')
    if (played.current === key) return
    played.current = key
    const token = key
    const live = () => played.current === token
    void (async () => {
      if (state.phase === 'need') await speak('You are the builder at Pebble Crossing. Pip will not cross until today\'s span is on. Tap the big plank.')
      if (state.phase === 'mouth' && state.mouthStep === 0) {
        await speak(MOUTH_LINE)
        await playSh()
        await playSh()
        if (live()) dispatch({ type: 'MOUTH_ADVANCE' })
      }
      if (state.phase === 'mouth' && state.mouthStep === 1) {
        await speak(micOff ? 'The microphone is off. You can still say it with me.' : 'Your turn. Send quiet air.')
        await playSh()
        const attempt = micOff ? false : (await detectVoiceAttempt()) === 'attempt_detected'
        await speak('Thanks for trying.')
        if (live()) dispatch({ type: 'MOUTH_ADVANCE', attemptDetected: attempt })
      }
      if (state.phase === 'phonics' && prompt && state.beatStep === 'hear') {
        await speak(prompt.hear)
        if (live()) dispatch({ type: 'HEAR_DONE' })
      }
      if (state.phase === 'phonics' && prompt && state.beatStep === 'blend') {
        await speak(prompt.reveal)
        if (live()) dispatch({ type: 'BLEND_DONE' })
      }
      if (state.phase === 'phonics' && prompt && state.beatStep === 'speak') {
        await speak(prompt.say)
        const attempt = micOff ? false : (await detectVoiceAttempt()) === 'attempt_detected'
        await speak('Thanks for trying.')
        if (live()) dispatch({ type: 'PRODUCTION_DONE', attemptDetected: attempt })
      }
      if (state.phase === 'retrieval' && state.beatStep === 'hear') {
        await speak('Listen to the four words.')
        for (const word of RETRIEVAL_WORDS) await speak(word)
        await speak('Which word has the quiet sound at the end?')
        if (live()) dispatch({ type: 'HEAR_DONE' })
      }
      if (state.phase === 'retrieval' && state.beatStep === 'model') {
        await speak('Fish. The quiet sound comes last.')
        await playSh()
        if (live()) dispatch({ type: 'RETRIEVAL_MODEL_DONE' })
      }
      if (state.phase === 'whole_words') {
        await speak(state.wholeWordStep === 0
          ? 'This says a. It is a whole word.'
          : 'This says the. The is a whole word. We are not learning th today.')
      }
      if (state.phase === 'math') {
        const fact = MATH_PROMPTS[state.mathIndex]
        if (fact) await speak(`Posts next. ${fact.voiceLine}`)
      }
      if (state.phase === 'sentence') {
        const outcome = micOff ? 'mic_off' as const : await listenForSentence()
        if (!live()) return
        const quality = sentenceRecovery(outcome)
        if (quality === 'mic_off') {
          dispatch({ type: 'SENTENCE_RESULT', quality })
          return
        }
        void speak(quality === 'attempt'
          ? 'I heard a try. That is not a reading check.'
          : 'I could not use that as a reading check.')
        dispatch({ type: 'SENTENCE_RESULT', quality })
      }
      if (state.phase === 'level_complete') {
        await speak(state.planks.some((plank) => plank.kind === 'practice')
          ? 'We built this span together. The light planks are words to try alone next time.'
          : 'You used the sounds in words to build this span.')
      }
    })()
  }, [state.phase, state.beatStep, state.phonicsIndex, state.mouthStep, state.mathIndex, state.wholeWordStep, micOff, suspended])

  useEffect(() => {
    if (!state.wobble || suspended) return
    const fact = MATH_PROMPTS[state.mathIndex]
    if (state.phase === 'math' && fact) void speak(missCoach('math', fact.voiceLine))
    if (state.phase === 'phonics') void speak(missCoach('phonics'))
  }, [state.wobble, state.shuffleSeed, state.phase, state.mathIndex, suspended])

  const prompt = PHONICS_PROMPTS[state.phonicsIndex]
  const math = MATH_PROMPTS[state.mathIndex]
  const caption = captionFor(state)
  const sign = state.signBolted ? 'bolted' : state.signPractice ? 'practice' : 'none'

  return (
    <main className="game">
      <header className="topbar">
        <p className="brand">Pebble Crossing</p>
        <p className="pieces" data-pieces={piecesRemaining(state)}>{piecesRemaining(state) === 0 ? 'Span closed' : piecesRemaining(state) === 1 ? '1 piece to go' : `${piecesRemaining(state)} pieces to go`}</p>
        <button type="button" className="grownups" onClick={onParent}>Grown-ups</button>
      </header>
      <section className="layout">
        <CreekStage
          scarf={state.scarf}
          world={state.world}
          planks={state.planks}
          posts={state.posts}
          sign={sign}
          pose={state.beatStep === 'speak' || state.phase === 'mouth' ? 'listen' : state.beatStep === 'blend' ? 'reach' : state.phase === 'hard_done' ? 'sit' : 'idle'}
          crossed={state.phase === 'hard_done' || state.phase === 'level_complete'}
          caption={caption}
        />
        <section className="tray" aria-live="polite">
          {state.phase === 'scarf' && (
            <>
              <h1>Choose Pip&apos;s scarf</h1>
              <div className="scarf-row">
                {SCARVES.map((color) => (
                  <button key={color} type="button" className={`scarf scarf-${color}`} onClick={() => {
                    window.sessionStorage.setItem(SCARF_KEY, color)
                    dispatch({ type: 'PICK_SCARF', scarf: color })
                  }}>{color}</button>
                ))}
              </div>
            </>
          )}
          {state.phase === 'need' && (
            <button type="button" className="plank-action" onClick={() => dispatch({ type: 'START_SPAN' })}>Tap the big plank</button>
          )}
          {state.phase === 'mouth' && <MouthCue />}
          {state.phase === 'phonics' && prompt && state.beatStep === 'choose' && (
            <>
              <p className="mask">{prompt.mask}</p>
              <p>{prompt.position === 'end' ? 'Tap the sound at the end.' : 'Tap the sound at the start.'}</p>
              <Tiles
                tiles={shuffleWithSeed(prompt.tiles, state.shuffleSeed)}
                disabled={!state.inputOpen}
                modeled={state.modeled ? prompt.correctTile : undefined}
                wobble={state.wobble}
                onPick={(tile) => dispatch({ type: 'PHONICS_TILE', tile })}
              />
            </>
          )}
          {state.phase === 'phonics' && prompt && state.beatStep === 'blend' && <p className="reveal sweep">{prompt.word}</p>}
          {state.phase === 'phonics' && prompt && state.beatStep === 'speak' && <p className="reveal">Say {prompt.word}</p>}
          {state.phase === 'phonics' && state.beatStep === 'hear' && <p>Listen first.</p>}
          {state.phase === 'retrieval' && state.beatStep === 'choose' && (
            <>
              <p>Which word has the quiet sound at the end?</p>
              <Tiles tiles={[...RETRIEVAL_WORDS]} disabled={!state.inputOpen} wobble={state.wobble} onPick={(tile) => dispatch({ type: 'RETRIEVAL_PICK', word: tile })} />
            </>
          )}
          {state.phase === 'retrieval' && state.beatStep !== 'choose' && <p>Listen to the four words.</p>}
          {state.phase === 'whole_words' && (
            <button type="button" className="big" onClick={() => dispatch({ type: 'WHOLE_WORD_ADVANCE' })}>
              {state.wholeWordStep === 0 ? 'a' : 'the'}
            </button>
          )}
          {state.phase === 'math' && math && (
            <>
              <p className="fact">{math.expression}</p>
              <div className="trays">
                <Dots count={math.left} label={math.material} />
                <Dots count={math.right} label={math.op === '-' ? 'move away' : 'add'} faded={math.op === '-'} />
              </div>
              {state.wobble && <p>{missCoach('math', math.voiceLine)}</p>}
              <Tiles
                tiles={shuffleWithSeed(math.tiles, state.shuffleSeed)}
                disabled={!state.inputOpen}
                modeled={state.modeled ? String(math.correct) : undefined}
                wobble={state.wobble}
                onPick={(tile) => dispatch({ type: 'MATH_TILE', value: Number(tile) })}
              />
            </>
          )}
          {state.phase === 'sentence' && (
            <>
              <p className="reveal">{SENTENCE}</p>
              <p>Read the sign if you want. I will not score your voice.</p>
              <button type="button" className="big" onClick={() => dispatch({ type: 'SENTENCE_RESULT', quality: 'mic_off' })}>
                Continue without microphone
              </button>
            </>
          )}
          {state.phase === 'level_complete' && (
            <>
              <h1>Today&apos;s span is done.</h1>
              <p>Pip can step across.</p>
              <button type="button" className="big" onClick={() => dispatch({ type: 'LEVEL_COMPLETE_ACK' })}>Show a grown-up</button>
            </>
          )}
          {state.phase === 'hard_done' && (
            <>
              <h1>Pebble Crossing is closed for today.</h1>
              <button type="button" className="big" onClick={() => dispatch({ type: 'REPLAY_PIP' })}>Show the span</button>
            </>
          )}
        </section>
      </section>
    </main>
  )
}

function MouthCue() {
  return (
    <div className="mouth">
      <svg viewBox="0 0 160 120" aria-hidden="true">
        <circle cx="80" cy="62" r="46" fill="#f3c7a6" />
        <circle cx="62" cy="52" r="4" fill="#173b3a" />
        <circle cx="98" cy="52" r="4" fill="#173b3a" />
        <path d="M58 84 Q80 98 102 84" fill="none" stroke="#a7643e" strokeWidth="4" />
        <path d="M64 78 h32" stroke="#fff8e8" strokeWidth="6" />
        <path className="air" d="M112 86 q16 0 18 12" fill="none" stroke="#8ec7d4" strokeWidth="3" />
      </svg>
      <p>Quiet air. Throat stays quiet.</p>
    </div>
  )
}

function Tiles({ tiles, disabled, modeled, wobble, onPick }: { tiles: readonly (string | number)[]; disabled: boolean; modeled?: string; wobble: boolean; onPick: (tile: string) => void }) {
  return (
    <div className={`tiles ${wobble ? 'wobble' : ''}`}>
      {tiles.map((tile) => (
        <button key={String(tile)} type="button" disabled={disabled} className={modeled === String(tile) ? 'modeled' : ''} onClick={() => onPick(String(tile))}>{tile}</button>
      ))}
    </div>
  )
}

function Dots({ count, label, faded = false }: { count: number; label: string; faded?: boolean }) {
  return (
    <div className={`dots ${faded ? 'faded' : ''}`} aria-label={`${count} ${label}`}>
      {Array.from({ length: count }, (_, index) => <i key={index} />)}
    </div>
  )
}

function captionFor(state: SessionState): string {
  if (state.world.kit === 'aboard') return 'Kit the cat sits on the docked ship. The span is in place.'
  if (state.world.fish === 'helped') return 'The fish has pushed the rope back to shore.'
  if (state.world.shell === 'lifted') return 'Pip has lifted the shell off the last bolt.'
  if (state.world.shop === 'open') return 'The creek shop is open and the bolt tray is out.'
  if (state.world.ship === 'docked') return 'The ship is docked with a plank.'
  if (state.world.map === 'open') return 'Kit sits on the open map.'
  if (state.world.kit === 'arrived') return 'Kit the cat has arrived with the map.'
  return 'Pip waits beside an unfinished creek bridge.'
}