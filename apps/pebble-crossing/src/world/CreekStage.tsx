import type { ScarfColor } from '../content/level6'
import type { PlankRecord, PostRecord, WorldState } from '../session/types'

interface CreekStageProps {
  scarf: ScarfColor | null
  world: WorldState
  planks: PlankRecord[]
  posts: PostRecord[]
  sign: 'none' | 'practice' | 'bolted'
  pose: 'idle' | 'listen' | 'reach' | 'sit'
  crossed: boolean
  caption: string
}

const SCARF = { red: '#d4534b', leaf: '#3f8f62', stone: '#8d857b' }

export function CreekStage(props: CreekStageProps) {
  const { world, planks, posts, sign, scarf, pose, crossed, caption } = props
  const pipX = crossed ? 760 : pose === 'reach' ? 390 : 430
  const shipX = 230
  return (
    <figure className="creek" aria-label={caption}>
      <svg viewBox="0 0 960 540" role="img">
        <title>{caption}</title>
        <defs>
          <linearGradient id="pc-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#d7f1ef" />
            <stop offset="1" stopColor="#8ec7d4" />
          </linearGradient>
          <linearGradient id="pc-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#4f9bb7" />
            <stop offset="1" stopColor="#1f6e86" />
          </linearGradient>
        </defs>
        <rect width="960" height="540" fill="url(#pc-sky)" />
        <ellipse cx="760" cy="90" rx="70" ry="24" fill="#fff6df" opacity="0.8" />
        <path d="M0 230 C 180 210 300 260 470 230 C 650 196 790 250 960 214 L960 300 L0 300 Z" fill="#6ea36a" />
        <rect x="40" y="150" width="170" height="110" rx="8" fill="#a7643e" />
        <rect x="62" y="172" width="126" height="68" rx="4" fill={world.shop === 'open' ? '#f4e2c2' : '#6b442c'} />
        {world.shop === 'open' && <rect x="78" y="206" width="96" height="16" rx="8" fill="#d9c59f" />}
        <path d="M28 150 L125 92 L222 150" fill="#8d4b32" />
        <rect y="330" width="960" height="140" fill="url(#pc-water)" />
        <path className="current" d="M0 390 C 140 374 220 408 360 388 C 520 364 640 412 820 386 C 900 374 940 400 960 388" fill="none" stroke="#d8f4f8" strokeWidth="5" opacity="0.75" />
        <rect x="300" y="292" width="420" height="28" rx="6" fill="#6b442c" />
        {planks.map((plank, index) => (
          <g key={`${plank.promptId}-${index}`} data-plank={plank.promptId} data-kind={plank.kind}>
            <rect x={318 + index * 64} y="268" width="54" height="22" rx="4" fill={plank.kind === 'bolted' ? '#a7643e' : '#d9c59f'} stroke="#5c3a1a" strokeWidth="2" />
            {plank.kind === 'bolted' ? <circle cx={345 + index * 64} cy="279" r="5" fill="#f2b84b" stroke="#5c3a1a" /> : <path d={`M${326 + index * 64} 276 h38`} stroke="#6b5344" strokeWidth="3" strokeDasharray="5 3" />}
          </g>
        ))}
        {posts.map((post, index) => (
          <g key={post.promptId}>
            <rect x={340 + index * 95} y="320" width="18" height="58" rx="4" fill={post.kind === 'bolted' ? '#6b5344' : '#b9a48a'} />
            {post.kind === 'helped' && <path d={`M${334 + index * 95} 348 q14 20 30 0`} fill="none" stroke="#f5ecd8" strokeWidth="4" />}
          </g>
        ))}
        {world.ship === 'docked' && (
          <g className="ship" transform={`translate(${shipX} 300)`}>
            <path d="M0 48 Q80 86 170 48 L150 20 H22 Z" fill="#f4e2c2" stroke="#5c3a1a" strokeWidth="3" />
            <path d="M62 20 V-36 h52 v36" fill="#8d4b32" />
          </g>
        )}
        {world.fish === 'helped' && <ellipse cx="560" cy="400" rx="34" ry="16" fill="#ef8b4c" stroke="#a7643e" strokeWidth="3" />}
        {world.shell === 'lifted' && <path d="M620 286 q24 -28 48 0 q-24 12 -48 0" fill="#f2d7b6" stroke="#8d6b55" strokeWidth="3" />}
        {world.rope !== 'creek' && <path d="M500 300 C 560 250 620 300 700 280" fill="none" stroke="#f5ecd8" strokeWidth={world.rope === 'tight' ? 7 : 4} />}
        {world.map !== 'folded' && <rect x="250" y="188" width="62" height="42" rx="4" fill="#f7f1df" stroke="#8d6b55" strokeWidth="3" />}
        {(sign === 'practice' || sign === 'bolted') && (
          <g data-sign={sign}>
          <g transform="translate(24 18)">
            <rect width="230" height="54" rx="6" fill="#fff8e8" stroke="#5c3a1a" strokeWidth="3" strokeDasharray={sign === 'practice' ? '7 5' : '0'} />
            <text x="14" y="34" fontSize="18" fill="#173b3a">The cat sat on a ship.</text>
          </g>
          </g>
        )}
        <g className={`pip pose-${pose}`} transform={`translate(${pipX} 168) scale(1.35)`}>
          <ellipse cx="34" cy="58" rx="26" ry="16" fill="#e07a3d" />
          <path d="M58 52 q24 8 10 24 q-16 -4 -10 -24" fill="#c45b28" />
          <circle cx="30" cy="34" r="20" fill="#e07a3d" />
          <path d="M14 22 L20 4 L28 20" fill="#e07a3d" />
          <path d="M30 20 L36 2 L44 22" fill="#e07a3d" />
          <circle cx="24" cy="32" r="2.2" fill="#173b3a" />
          <circle cx="36" cy="32" r="2.2" fill="#173b3a" />
          <ellipse cx="30" cy="40" rx="7" ry="4" fill="#fff1df" />
          <path d="M14 38 h32 q8 22 -10 34 q-22 -12 -22 -34" fill={SCARF[scarf ?? 'red']} />
        </g>
        {world.kit !== 'hidden' && (
          <g transform={world.kit === 'aboard' ? `translate(${shipX + 58} 286) scale(1.3)` : 'translate(300 150) scale(1.4)'}>
            <ellipse cx="16" cy="28" rx="16" ry="10" fill="#f2c14e" />
            <circle cx="16" cy="14" r="10" fill="#f2c14e" />
            <path d="M8 8 L10 -2 L16 8" fill="#f2c14e" />
            <path d="M18 8 L22 -2 L26 8" fill="#f2c14e" />
            {world.kit !== 'arrived' && <path d="M6 30 q10 8 20 0" fill="none" stroke="#a7643e" strokeWidth="2" />}
          </g>
        )}
      </svg>
    </figure>
  )
}