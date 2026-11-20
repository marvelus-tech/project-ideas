import { useEffect, useMemo, useState } from 'react'

import './TilePrompt.css'

interface TilePromptProps {
  tiles: (string | number)[]
  correct: string | number
  wobble: boolean
  modeled: boolean
  onPick: (tile: string | number) => void
  onWobbleEnd?: () => void
  label: string
}

function shuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr]
  let s = seed
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = s % (i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function TilePrompt({
  tiles,
  correct,
  wobble,
  modeled,
  onPick,
  onWobbleEnd,
  label,
}: TilePromptProps) {
  const [shake, setShake] = useState(false)
  const [shuffleKey, setShuffleKey] = useState(0)

  const displayTiles = useMemo(
    () => shuffle(tiles, shuffleKey + tiles.join('').length),
    [tiles, shuffleKey],
  )

  useEffect(() => {
    if (wobble) {
      setShake(true)
      setShuffleKey((k) => k + 1)
      const t = window.setTimeout(() => {
        setShake(false)
        onWobbleEnd?.()
      }, 650)
      return () => window.clearTimeout(t)
    }
  }, [wobble, onWobbleEnd])

  return (
    <section className={`tile-prompt ${shake ? 'tile-prompt--wobble' : ''}`}>
      <p className="tile-prompt__label">{label}</p>
      <p className="tile-prompt__hint">{modeled ? 'Tap with me.' : 'Pick one tile.'}</p>
      <ul className="tile-row" role="group" aria-label="Answer tiles">
        {displayTiles.map((tile) => {
          const isAnswer = tile === correct
          return (
            <li key={`${shuffleKey}-${tile}`}>
              <button
                type="button"
                className={`tile-btn ${modeled && isAnswer ? 'tile-btn--model' : ''}`}
                onClick={() => onPick(tile)}
              >
                {tile}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}