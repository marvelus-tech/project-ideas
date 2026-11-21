/** Illustrated pronunciation tray SVG masters (soft flat creek ink). */

const MAGENTA = '#FF00FF'
const INK = '#173b3a'
const SKIN = '#f3c7a6'
const LIP = '#a7643e'
const TEETH = '#fff8e8'
const AIR = '#8ec7d4'
const CREAM = '#fff8e8'
const TEAL = '#245c57'

function wrap(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="320" height="240">
  <rect width="320" height="240" fill="${MAGENTA}"/>
  ${body}
</svg>`
}

/** /ʃ/ model: teeth gap, lips forward, quiet air wisps. */
export function shModelSvg() {
  return wrap(`
  <ellipse cx="160" cy="138" rx="118" ry="88" fill="${SKIN}" stroke="${INK}" stroke-width="5"/>
  <path d="M92 118 Q160 78 228 118" fill="none" stroke="${LIP}" stroke-width="7" stroke-linecap="round"/>
  <path d="M104 148 Q160 172 216 148" fill="none" stroke="${LIP}" stroke-width="8" stroke-linecap="round"/>
  <rect x="118" y="136" width="84" height="10" rx="4" fill="${TEETH}"/>
  <path d="M218 138 Q248 132 262 148 Q272 158 268 168" fill="none" stroke="${AIR}" stroke-width="5" stroke-linecap="round"/>
  <path d="M226 152 Q252 148 266 162" fill="none" stroke="${AIR}" stroke-width="4" stroke-linecap="round" opacity="0.75"/>
`)
}

/** Stronger airflow for step 1 caption state. */
export function shAirflowSvg() {
  return wrap(`
  <ellipse cx="160" cy="138" rx="118" ry="88" fill="${SKIN}" stroke="${INK}" stroke-width="5"/>
  <path d="M92 118 Q160 74 228 118" fill="none" stroke="${LIP}" stroke-width="7" stroke-linecap="round"/>
  <path d="M104 150 Q160 176 216 150" fill="none" stroke="${LIP}" stroke-width="8" stroke-linecap="round"/>
  <rect x="118" y="136" width="84" height="10" rx="4" fill="${TEETH}"/>
  <path d="M214 134 Q256 118 278 138 Q292 152 286 170 Q280 182 268 178" fill="none" stroke="${AIR}" stroke-width="6" stroke-linecap="round"/>
  <path d="M220 150 Q268 142 286 162 Q296 174 288 186" fill="none" stroke="${AIR}" stroke-width="5" stroke-linecap="round"/>
  <path d="M208 164 Q240 172 252 188" fill="none" stroke="${AIR}" stroke-width="4" stroke-linecap="round" opacity="0.65"/>
`)
}

/** Closed calm listen — phonics hear. */
export function listenFirstSvg() {
  return wrap(`
  <ellipse cx="160" cy="142" rx="118" ry="88" fill="${SKIN}" stroke="${INK}" stroke-width="5"/>
  <path d="M108 126 Q160 108 212 126" fill="none" stroke="${LIP}" stroke-width="6" stroke-linecap="round"/>
  <path d="M98 158 Q160 176 222 158" fill="none" stroke="${LIP}" stroke-width="7" stroke-linecap="round"/>
  <path d="M118 144 Q160 150 202 144" fill="none" stroke="#c98d68" stroke-width="4" stroke-linecap="round"/>
`)
}

/** Pebble mic on cream plate — tap ready. */
export function micTapReadySvg() {
  return wrap(`
  <circle cx="160" cy="120" r="78" fill="${CREAM}" stroke="${TEAL}" stroke-width="6"/>
  <rect x="142" y="72" width="36" height="62" rx="18" fill="${TEAL}" stroke="${INK}" stroke-width="3"/>
  <path d="M128 108 Q160 134 192 108" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
  <rect x="152" y="132" width="16" height="22" rx="4" fill="${INK}"/>
  <rect x="138" y="152" width="44" height="8" rx="4" fill="${INK}"/>
`)
}

/** Mic with painted soft ring — listening. */
export function micListeningSvg() {
  return wrap(`
  <circle cx="160" cy="120" r="88" fill="none" stroke="${AIR}" stroke-width="10" opacity="0.55"/>
  <circle cx="160" cy="120" r="78" fill="${CREAM}" stroke="${TEAL}" stroke-width="6"/>
  <rect x="142" y="72" width="36" height="62" rx="18" fill="${TEAL}" stroke="${INK}" stroke-width="3"/>
  <path d="M128 108 Q160 134 192 108" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
  <rect x="152" y="132" width="16" height="22" rx="4" fill="${INK}"/>
  <rect x="138" y="152" width="44" height="8" rx="4" fill="${INK}"/>
`)
}

/** Mouth plus small sign silhouette — sentence invite. */
export function readInviteSvg() {
  return wrap(`
  <ellipse cx="148" cy="132" rx="100" ry="76" fill="${SKIN}" stroke="${INK}" stroke-width="5"/>
  <path d="M88 118 Q148 92 208 118" fill="none" stroke="${LIP}" stroke-width="6" stroke-linecap="round"/>
  <path d="M96 148 Q148 168 200 148" fill="none" stroke="${LIP}" stroke-width="7" stroke-linecap="round"/>
  <rect x="110" y="134" width="76" height="8" rx="3" fill="${TEETH}"/>
  <rect x="228" y="86" width="56" height="72" rx="6" fill="${CREAM}" stroke="${INK}" stroke-width="4"/>
  <line x1="238" y1="104" x2="272" y2="104" stroke="${TEAL}" stroke-width="4" stroke-linecap="round"/>
  <line x1="238" y1="122" x2="266" y2="122" stroke="${TEAL}" stroke-width="4" stroke-linecap="round"/>
  <line x1="238" y1="140" x2="258" y2="140" stroke="${TEAL}" stroke-width="4" stroke-linecap="round"/>
`)
}

export const PRONUNCIATION_MASTERS = [
  { id: 'sh_model', svg: shModelSvg },
  { id: 'sh_airflow', svg: shAirflowSvg },
  { id: 'listen_first', svg: listenFirstSvg },
  { id: 'mic_tap_ready', svg: micTapReadySvg },
  { id: 'mic_listening', svg: micListeningSvg },
  { id: 'read_invite', svg: readInviteSvg },
]