import type { PlankRecord, PostRecord } from '../session/types'

export function BridgeLayer({ planks, posts, sign }: { planks: PlankRecord[]; posts: PostRecord[]; sign: 'none' | 'practice' | 'bolted' }) {
  return (
    <svg className="creek-bridge" viewBox="0 0 960 540" preserveAspectRatio="none" aria-hidden="true">
      <rect x="340" y="346" width="280" height="22" rx="5" fill="#8d4b32" stroke="#173b3a" strokeWidth="2" />
      <rect x="346" y="354" width="268" height="5" rx="2" fill="#6b442c" />
      {planks.map((plank, index) => (
        <g key={`${plank.promptId}-${index}`} data-plank={plank.promptId} data-kind={plank.kind}>
          <rect x={350 + index * 44} y="332" width="36" height="16" rx="3" fill={plank.kind === 'bolted' ? '#a7643e' : '#d9c59f'} stroke="#5c3a1a" strokeWidth="2" />
          {plank.kind === 'bolted'
            ? <circle cx={368 + index * 44} cy="340" r="3.5" fill="#f2b84b" stroke="#5c3a1a" />
            : <path d={`M${356 + index * 44} 340 h24`} stroke="#6b5344" strokeWidth="2" strokeDasharray="4 3" />}
        </g>
      ))}
      {posts.map((post, index) => (
        <g key={post.promptId} data-post={post.promptId} data-kind={post.kind}>
          <rect x={368 + index * 64} y="368" width="14" height="40" rx="3" fill={post.kind === 'bolted' ? '#6b5344' : '#b9a48a'} />
          {post.kind === 'helped' && <path d={`M${362 + index * 64} 386 q12 16 26 0`} fill="none" stroke="#f5ecd8" strokeWidth="3" />}
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
