import type { PlankRecord, PostRecord } from '../session/types'

export function BridgeLayer({ planks, posts, sign }: { planks: PlankRecord[]; posts: PostRecord[]; sign: 'none' | 'practice' | 'bolted' }) {
  return (
    <svg className="creek-bridge" viewBox="0 0 960 540" preserveAspectRatio="none" aria-hidden="true">
      <rect x="300" y="292" width="420" height="28" rx="6" fill="#6b442c" />
      {planks.map((plank, index) => (
        <g key={`${plank.promptId}-${index}`} data-plank={plank.promptId} data-kind={plank.kind}>
          <rect x={318 + index * 64} y="268" width="54" height="22" rx="4" fill={plank.kind === 'bolted' ? '#a7643e' : '#d9c59f'} stroke="#5c3a1a" strokeWidth="2" />
          {plank.kind === 'bolted'
            ? <circle cx={345 + index * 64} cy="279" r="5" fill="#f2b84b" stroke="#5c3a1a" />
            : <path d={`M${326 + index * 64} 276 h38`} stroke="#6b5344" strokeWidth="3" strokeDasharray="5 3" />}
        </g>
      ))}
      {posts.map((post, index) => (
        <g key={post.promptId} data-post={post.promptId} data-kind={post.kind}>
          <rect x={340 + index * 95} y="320" width="18" height="58" rx="4" fill={post.kind === 'bolted' ? '#6b5344' : '#b9a48a'} />
          {post.kind === 'helped' && <path d={`M${334 + index * 95} 348 q14 20 30 0`} fill="none" stroke="#f5ecd8" strokeWidth="4" />}
        </g>
      ))}
      {(sign === 'practice' || sign === 'bolted') && (
        <g data-sign={sign} transform="translate(24 18)">
          <rect width="230" height="54" rx="6" fill="#fff8e8" stroke="#5c3a1a" strokeWidth="3" strokeDasharray={sign === 'practice' ? '7 5' : '0'} />
          <text x="14" y="34" fontSize="18" fill="#173b3a">The cat sat on a ship.</text>
        </g>
      )}
    </svg>
  )
}
