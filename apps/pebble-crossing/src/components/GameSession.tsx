import { useCallback, useEffect, useReducer, useRef, useState, type Dispatch, type SetStateAction } from 'react'

import { MATH_PROMPTS, MOUTH_LINE, PHONICS_PROMPTS, RETRIEVAL_WORDS, SCARF_KEY, SENTENCE, missCoach } from '../content/level6'
import type { ScarfColor } from '../content/level6'
import { PLAY_META_DESCRIPTION, PLAY_DOCUMENT_TITLE } from '../landing/landingCopy'
import { playSh, speak } from '../lib/audio'
import { usePageMeta } from '../lib/usePageMeta'
import { readPlaytestParams } from '../lib/params'
import { piecesRemaining, sessionReducer, shuffleWithSeed } from '../session/level6Machine'
import { previewSession } from '../session/preview'
import { buildParentReport, persistParentReport } from '../session/sessionStats'
import type { SessionState } from '../session/types'
import {
  PRODUCTION_READY,
  SENTENCE_READY,
  runProductionTurn,
  runSentenceTurn,
  type SentenceTurnUi,
  type SpeechTurnUi,
} from '../session/speechTurn'
import { scarfPreviewStyle } from '../assets/world/worldAssets'
import { MicPlateArt } from './MicPlateArt'
import { MouthTrayArt, PronunciationTrayArt } from './PronunciationTrayArt'
import { CreekStage } from '../world/CreekStage'
import './GameSession.css'

const SCARVES: ScarfColor[] = ['red', 'leaf', 'stone']

interface ProductionUi {
  ui: SpeechTurnUi
  status: string
}

interface SentenceUi {
  ui: SentenceTurnUi
  status: string
  showContinue: boolean
}

export function GameSession({ onParent, suspended = false }: { onParent: () => void; suspended?: boolean }) {
  usePageMeta({ title: PLAY_DOCUMENT_TITLE, description: PLAY_META_DESCRIPTION })

  const params = new URLSearchParams(window.location.search)
  const { maxMinutes, micOff } = readPlaytestParams()
  const [state, dispatch] = useReducer(sessionReducer, params.get('scene'), previewSession)
  const [productionUi, setProductionUi] = useState<ProductionUi>({ ui: 'idle', status: '' })
  const [sentenceUi, setSentenceUi] = useState<SentenceUi>({ ui: 'idle', status: '', showContinue: false })
  const played = useRef('')
  const tapRef = useRef<(() => void) | null>(null)
  const speechAbortRef = useRef<AbortController | null>(null)
  const childName = window.sessionStorage.getItem('pebble-crossing-child-name') ?? 'Sam'

  const waitForTap = useCallback(
    () =>
      new Promise<void>((resolve) => {
        tapRef.current = resolve
      }),
    [],
  )

  const onMicReadyTap = useCallback(() => {
    tapRef.current?.()
    tapRef.current = null
  }, [])

  const resetSpeechAbort = useCallback(() => {
    speechAbortRef.current?.abort()
    const next = new AbortController()
    speechAbortRef.current = next
    return next
  }, [])

  const continueWithoutMic = useCallback(() => {
    speechAbortRef.current?.abort()
    tapRef.current = null
    dispatch({ type: 'SENTENCE_RESULT', quality: 'mic_off' })
  }, [])

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
    const activeProduction =
      (state.phase === 'mouth' && state.mouthStep === 1) || (state.phase === 'phonics' && state.beatStep === 'speak')
    if (!activeProduction) setProductionUi({ ui: 'idle', status: '' })
    if (state.phase !== 'sentence') setSentenceUi({ ui: 'idle', status: '', showContinue: false })
  }, [state.phase, state.mouthStep, state.beatStep])

  useEffect(() => {
    if (suspended) return
    const prompt = PHONICS_PROMPTS[state.phonicsIndex]
    const key = [state.phase, state.phonicsIndex, state.beatStep, state.mouthStep, state.mathIndex, state.wholeWordStep].join(':')
    if (played.current === key) return
    played.current = key
    const token = key
    const live = () => played.current === token
    void runSessionBeat({
      state,
      micOff,
      prompt,
      live,
      dispatch,
      resetSpeechAbort,
      waitForTap,
      setProductionUi,
      setSentenceUi,
    })
  }, [state.phase, state.beatStep, state.phonicsIndex, state.mouthStep, state.mathIndex, state.wholeWordStep, micOff, suspended, resetSpeechAbort, waitForTap])

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
  const speechListenPose =
    productionUi.ui === 'listening' ||
    productionUi.ui === 'ready' ||
    sentenceUi.ui === 'listening' ||
    sentenceUi.ui === 'ready'

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
          pose={
            speechListenPose
              ? 'listen'
              : state.beatStep === 'speak' || state.phase === 'mouth'
                ? 'listen'
                : state.beatStep === 'blend'
                  ? 'reach'
                  : state.phase === 'hard_done'
                    ? 'sit'
                    : 'idle'
          }
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
                  }}>
                    <span className="scarf-pip" style={scarfPreviewStyle(color)} aria-hidden="true" />
                    {color}
                  </button>
                ))}
              </div>
            </>
          )}
          {state.phase === 'need' && (
            <button type="button" className="plank-action" onClick={() => dispatch({ type: 'START_SPAN' })}>Tap the big plank</button>
          )}
          {state.phase === 'mouth' && (
            <>
              <MouthTrayArt mouthStep={state.mouthStep} />
              {state.mouthStep === 1 && <SpeechTurnPanel ui={productionUi} onMicTap={onMicReadyTap} />}
            </>
          )}
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
          {state.phase === 'phonics' && prompt && state.beatStep === 'speak' && (
            <>
              <p className="reveal">Say {prompt.word}</p>
              <SpeechTurnPanel ui={productionUi} onMicTap={onMicReadyTap} />
            </>
          )}
          {state.phase === 'phonics' && state.beatStep === 'hear' && (
            <>
              <PronunciationTrayArt cue="listen_first" />
              <p>Listen first.</p>
            </>
          )}
          {state.phase === 'retrieval' && state.beatStep === 'choose' && (
            <>
              <p>Which word has the quiet sound at the end?</p>
              <Tiles tiles={[...RETRIEVAL_WORDS]} disabled={!state.inputOpen} wobble={state.wobble} onPick={(tile) => dispatch({ type: 'RETRIEVAL_PICK', word: tile })} />
            </>
          )}
          {state.phase === 'retrieval' && state.beatStep === 'model' && (
            <PronunciationTrayArt cue="sh_model" className="retrieval-model" />
          )}
          {state.phase === 'retrieval' && state.beatStep !== 'choose' && state.beatStep !== 'model' && (
            <p>Listen to the four words.</p>
          )}
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
              {(sentenceUi.ui === 'idle' || sentenceUi.ui === 'ready') && (
                <PronunciationTrayArt cue="read_invite" className="sentence-invite" />
              )}
              <SentenceTurnPanel ui={sentenceUi} onMicTap={onMicReadyTap} />
              {(sentenceUi.showContinue || sentenceUi.ui === 'showContinue') && (
                <button
                  type="button"
                  className="big mic-off"
                  autoFocus
                  onClick={continueWithoutMic}
                >
                  Continue without microphone
                </button>
              )}
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

async function runSessionBeat(args: {
  state: SessionState
  micOff: boolean
  prompt: (typeof PHONICS_PROMPTS)[number] | undefined
  live: () => boolean
  dispatch: React.Dispatch<import('../session/types').SessionAction>
  resetSpeechAbort: () => AbortController
  waitForTap: () => Promise<void>
  setProductionUi: (ui: ProductionUi) => void
  setSentenceUi: Dispatch<SetStateAction<SentenceUi>>
}) {
  const { state, micOff, prompt, live, dispatch, resetSpeechAbort, waitForTap, setProductionUi, setSentenceUi } = args

  if (state.phase === 'need') await speak('You are the builder at Pebble Crossing. Pip will not cross until today\'s span is on. Tap the big plank.')

  if (state.phase === 'mouth' && state.mouthStep === 0) {
    await speak(MOUTH_LINE)
    await playSh()
    await playSh()
    if (live()) dispatch({ type: 'MOUTH_ADVANCE' })
    return
  }

  if (state.phase === 'mouth' && state.mouthStep === 1) {
    const attempt = await runProductionTurnFlow({
      micOff,
      guide: async () => {
        await speak(micOff ? 'The microphone is off. You can still say it with me.' : 'Your turn. Send quiet air.')
        await playSh()
      },
      replayModel: playSh,
      live,
      resetSpeechAbort,
      waitForTap,
      setProductionUi,
    })
    await speak('Thanks for trying.')
    if (live()) dispatch({ type: 'MOUTH_ADVANCE', attemptDetected: attempt })
    return
  }

  if (state.phase === 'phonics' && prompt && state.beatStep === 'hear') {
    await speak(prompt.hear)
    if (live()) dispatch({ type: 'HEAR_DONE' })
    return
  }

  if (state.phase === 'phonics' && prompt && state.beatStep === 'blend') {
    await speak(prompt.reveal)
    if (live()) dispatch({ type: 'BLEND_DONE' })
    return
  }

  if (state.phase === 'phonics' && prompt && state.beatStep === 'speak') {
    const attempt = await runProductionTurnFlow({
      micOff,
      guide: () => speak(prompt.say),
      replayModel: () => speak(prompt.word),
      live,
      resetSpeechAbort,
      waitForTap,
      setProductionUi,
    })
    await speak('Thanks for trying.')
    if (live()) dispatch({ type: 'PRODUCTION_DONE', attemptDetected: attempt })
    return
  }

  if (state.phase === 'retrieval' && state.beatStep === 'hear') {
    await speak('Listen to the four words.')
    for (const word of RETRIEVAL_WORDS) await speak(word)
    await speak('Which word has the quiet sound at the end?')
    if (live()) dispatch({ type: 'HEAR_DONE' })
    return
  }

  if (state.phase === 'retrieval' && state.beatStep === 'model') {
    await speak('Fish. The quiet sound comes last.')
    await playSh()
    if (live()) dispatch({ type: 'RETRIEVAL_MODEL_DONE' })
    return
  }

  if (state.phase === 'whole_words') {
    await speak(state.wholeWordStep === 0
      ? 'This says a. It is a whole word.'
      : 'This says the. The is a whole word. We are not learning th today.')
    return
  }

  if (state.phase === 'math') {
    const fact = MATH_PROMPTS[state.mathIndex]
    if (fact) await speak(`Posts next. ${fact.voiceLine}`)
    return
  }

  if (state.phase === 'sentence') {
    await speak('The dockkeeper needs to know what happened. Read the launch card.')
    const result = await runSentenceTurnFlow({
      micOff,
      live,
      resetSpeechAbort,
      waitForTap,
      setSentenceUi,
    })
    if (!live()) return
    if (result.quality === 'attempt') {
      await speak('I heard a try. That is not a reading check.')
    } else if (result.quality !== 'mic_off') {
      await speak('I could not use that as a reading check.')
    }
    dispatch({ type: 'SENTENCE_RESULT', quality: result.quality })
    return
  }

  if (state.phase === 'level_complete') {
    await speak(state.planks.some((plank) => plank.kind === 'practice')
      ? 'We built this span together. The light planks are words to try alone next time.'
      : 'You used the sounds in words to build this span.')
  }
}

async function runProductionTurnFlow(args: {
  micOff: boolean
  guide: () => Promise<void>
  replayModel: () => Promise<void>
  live: () => boolean
  resetSpeechAbort: () => AbortController
  waitForTap: () => Promise<void>
  setProductionUi: (ui: ProductionUi) => void
}): Promise<boolean> {
  const { micOff, guide, replayModel, live, resetSpeechAbort, waitForTap, setProductionUi } = args
  await guide()
  if (!live()) return false
  const ac = resetSpeechAbort()
  const attempt = await runProductionTurn(micOff, replayModel, {
    waitForTap,
    signal: ac.signal,
    setUi: (ui, status) => setProductionUi({ ui: ui as SpeechTurnUi, status }),
  })
  return attempt
}

async function runSentenceTurnFlow(args: {
  micOff: boolean
  live: () => boolean
  resetSpeechAbort: () => AbortController
  waitForTap: () => Promise<void>
  setSentenceUi: Dispatch<SetStateAction<SentenceUi>>
}): Promise<{ quality: 'mic_off' | 'attempt' | 'unclear' }> {
  const { micOff, live, resetSpeechAbort, waitForTap, setSentenceUi } = args
  if (!live()) return { quality: 'mic_off' }
  const ac = resetSpeechAbort()
  const result = await runSentenceTurn(micOff, {
    waitForTap,
    signal: ac.signal,
    setUi: (ui, status) =>
      setSentenceUi((prev) => ({
        ui: ui as SentenceTurnUi,
        status,
        showContinue: prev.showContinue || ui === 'showContinue',
      })),
  })
  return { quality: result.quality }
}

function SpeechTurnPanel({ ui, onMicTap }: { ui: ProductionUi; onMicTap: () => void }) {
  if (ui.ui === 'idle' || ui.ui === 'done') return null
  return (
    <div className="speech-turn">
      {ui.ui === 'ready' && (
        <button type="button" className="mic-ready" onClick={onMicTap}>
          <MicPlateArt listening={false} />
          <span className="mic-label">{PRODUCTION_READY}</span>
        </button>
      )}
      {(ui.ui === 'listening' || ui.ui === 'retry') && (
        <div className="mic-listening" role="status" aria-live="assertive">
          <MicPlateArt listening />
          <p>{ui.status || 'Listening for your voice.'}</p>
        </div>
      )}
    </div>
  )
}

function SentenceTurnPanel({ ui, onMicTap }: { ui: SentenceUi; onMicTap: () => void }) {
  if (ui.ui === 'idle' || ui.ui === 'done') return null
  if (ui.ui === 'showContinue') {
    return (
      <div className="speech-turn" role="status" aria-live="assertive">
        <p>{ui.status}</p>
      </div>
    )
  }
  return (
    <div className="speech-turn">
      {ui.ui === 'ready' && (
        <button type="button" className="mic-ready" onClick={onMicTap}>
          <MicPlateArt listening={false} />
          <span className="mic-label">{SENTENCE_READY}</span>
        </button>
      )}
      {(ui.ui === 'listening' || ui.ui === 'retry') && (
        <div className="mic-listening" role="status" aria-live="assertive">
          <MicPlateArt listening />
          <p>{ui.status || 'Listening for your voice.'}</p>
        </div>
      )}
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