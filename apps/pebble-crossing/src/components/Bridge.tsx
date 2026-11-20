import type { PlankRecord, PostRecord } from '../session/types'

import './Bridge.css'

interface BridgeProps {
  planks: PlankRecord[]
  posts: PostRecord[]
  signBolted: boolean
  signPractice: boolean
  pipWalkKey: number
  scarf: string | null
}

export function Bridge({
  planks,
  posts,
  signBolted,
  signPractice,
  pipWalkKey,
  scarf,
}: BridgeProps) {
  const bolted = planks.filter((p) => p.kind === 'bolted').length
  const practice = planks.filter((p) => p.kind === 'practice').length
  const boltedPosts = posts.filter((p) => p.kind === 'bolted').length
  const helpedPosts = posts.filter((p) => p.kind === 'helped').length

  return (
    <hgroup className="bridge-scene" aria-label="Creek bridge span">
      <p className="bridge-sky" />
      <p className="bridge-water" />
      <p className={`pip pip--${scarf ?? 'red'} pip-walk-${pipWalkKey % 2}`} aria-hidden>
        🦊
      </p>
      <ul className="bridge-planks">
        {Array.from({ length: bolted }).map((_, i) => (
          <li key={`b-${i}`} className="plank plank--bolted" />
        ))}
        {Array.from({ length: practice }).map((_, i) => (
          <li key={`p-${i}`} className="plank plank--practice" />
        ))}
      </ul>
      <ul className="bridge-posts">
        {Array.from({ length: boltedPosts }).map((_, i) => (
          <li key={`post-b-${i}`} className="post post--bolted" />
        ))}
        {Array.from({ length: helpedPosts }).map((_, i) => (
          <li key={`post-h-${i}`} className="post post--helped" />
        ))}
      </ul>
      {(signBolted || signPractice) && (
        <p
          className={`sign ${signBolted ? 'sign--bolted' : 'sign--practice'}`}
          role="status"
        >
          The cat sat on a ship.
        </p>
      )}
    </hgroup>
  )
}