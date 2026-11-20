/** Original cut-paper sources for the morning creek. Rasterized by optimize-world-assets.mjs. */

export const FRAME = { width: 960, height: 540 }
export const PIP_CELL = { width: 200, height: 230 }
export const KIT_CELL = { width: 200, height: 220 }
export const PIP_POSES = ['idle', 'listen', 'reach', 'sit']
export const SCARVES = ['red', 'leaf', 'stone']
export const KIT_POSES = ['arrived', 'sitting', 'aboard']

const SHOP = { x: 46, y: 132, w: 188, h: 124, winX: 72, winY: 162, winW: 136, winH: 72 }

const SCARF_COLOR = { red: '#d4534b', leaf: '#3f8f62', stone: '#8d857b' }

function rng(seed) {
  let value = seed
  return () => {
    value = (value * 16807 + 11) % 2147483647
    return value / 2147483647
  }
}

function svg(body, width, height) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`
}

function wave(y, amp, seed, step = 18) {
  const rand = rng(seed)
  let d = ''
  for (let x = 0; x <= FRAME.width; x += step) {
    const jitter = (rand() - 0.5) * amp * 0.35
    const yPos = y + Math.sin(x / 78 + seed) * amp + Math.sin(x / 27 + seed * 1.4) * amp * 0.45 + jitter
    d += `${x === 0 ? 'M' : 'L'}${x.toFixed(1)} ${yPos.toFixed(1)}`
  }
  return d
}

function band(y, amp, seed, bottom = FRAME.height) {
  return `${wave(y, amp, seed)} L${FRAME.width} ${bottom} L0 ${bottom} Z`
}

function scraps(count, seed, area, color, opacity) {
  const rand = rng(seed)
  let out = ''
  for (let index = 0; index < count; index += 1) {
    const x = area.x + rand() * area.w
    const y = area.y + rand() * area.h
    const w = 7 + rand() * 26
    const h = 3 + rand() * 9
    const rot = (rand() - 0.5) * 50
    out += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="1.5" fill="${color}" opacity="${opacity}" transform="rotate(${rot.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`
  }
  return out
}

function shopShell() {
  const { x, y, w, h } = SHOP
  const mid = x + w / 2
  const peak = y - 70
  const colors = ['#c4784e', '#b56b42', '#a7643e', '#9a5c38', '#b87349']
  let boards = ''
  const count = 14
  const bw = w / count
  for (let index = 0; index < count; index += 1) {
    boards += `<rect x="${(x + index * bw).toFixed(2)}" y="${y}" width="${(bw + 0.8).toFixed(2)}" height="${h}" fill="${colors[index % colors.length]}"/>`
  }
  let shingles = ''
  for (let row = 0; row < 5; row += 1) {
    const yy = peak + 16 + row * 12
    shingles += `<path d="M${x - 10} ${yy} H${x + w + 10}" fill="none" stroke="#6b3a28" stroke-width="2" opacity="0.45"/>`
  }
  return `
    <path d="M${x - 18} ${y + 8} L${mid} ${peak + 8} L${x + w + 18} ${y + 8} Z" fill="#5c331f"/>
    <path d="M${x - 14} ${y} L${mid} ${peak} L${x + w + 14} ${y} Z" fill="#8d4b32" stroke="#173b3a" stroke-width="2.2" stroke-linejoin="round"/>
    ${shingles}
    <rect x="${x + 5}" y="${y + 6}" width="${w}" height="${h}" rx="3" fill="#6b3a28" opacity="0.28"/>
    ${boards}
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#173b3a" stroke-width="2.4"/>
    <rect x="${x + 18}" y="${y + h - 10}" width="${w - 36}" height="12" rx="2" fill="#6b442c"/>
  `
}

function shopClosed() {
  const { winX, winY, winW, winH } = SHOP
  let slats = ''
  for (let index = 0; index < 6; index += 1) {
    slats += `<rect x="${winX}" y="${winY + index * (winH / 6)}" width="${winW}" height="${winH / 6 + 1}" fill="${index % 2 ? '#4e3224' : '#5c3a2a'}"/>`
  }
  return `
    <rect x="${winX - 4}" y="${winY - 4}" width="${winW + 8}" height="${winH + 8}" fill="#3f291c"/>
    ${slats}
    <path d="M${winX + 18} ${winY + winH - 8} h${winW - 36}" stroke="#d9c59f" stroke-width="3" opacity="0.7"/>
  `
}

function shopOpen() {
  const { winX, winY, winW, winH } = SHOP
  let bolts = ''
  for (let index = 0; index < 5; index += 1) {
    bolts += `<circle cx="${winX + 22 + index * 20}" cy="${winY + winH - 14}" r="5" fill="#f2b84b" stroke="#5c3a1a" stroke-width="1.4"/>`
  }
  return `
    <rect x="${winX - 6}" y="${winY - 8}" width="${winW + 12}" height="${winH + 16}" rx="3" fill="#fff6df" stroke="#173b3a" stroke-width="2.4"/>
    <rect x="${winX + 6}" y="${winY + 6}" width="${winW - 12}" height="${winH - 28}" fill="#f4e2c2"/>
    <rect x="${winX + 14}" y="${winY + 14}" width="28" height="22" fill="#f7f1df" opacity="0.85"/>
    <rect x="${winX + 10}" y="${winY + winH - 24}" width="${winW - 20}" height="16" rx="3" fill="#d9c59f" stroke="#5c3a1a" stroke-width="1.5"/>
    ${bolts}
  `
}

export function creekBaseSvg() {
  const sky = [0, 36, 78, 120, 168].map((y, index) => {
    const colors = ['#f6e4c0', '#f3ddb4', '#d7efe4', '#b7e0dc', '#8ec7d4']
    return `<path d="${band(y, 10, index + 2, y + 70)}" fill="${colors[index]}"/>`
  }).join('')
  const hills = `
    <path d="${band(188, 18, 4, 330)}" fill="#9ecf96"/>
    <path d="${band(214, 14, 9, 340)}" fill="#6ea36a"/>
    <path d="${band(246, 12, 6, 360)}" fill="#4f8a5c"/>
  `
  const trees = [620, 690, 760, 840].map((x, index) => `
    <path d="M${x} 214 L${x + 18} 168 L${x + 36} 214 Z" fill="${index % 2 ? '#3f6b4a' : '#2f5a40'}" stroke="#173b3a" stroke-width="1.4"/>
    <rect x="${x + 14}" y="214" width="8" height="22" fill="#6b442c"/>
  `).join('')
  const water = `
    <path d="${band(312, 8, 3, FRAME.height)}" fill="#1d6c84"/>
    <path d="${band(338, 10, 8, FRAME.height)}" fill="#2f86a4"/>
    <path d="${band(372, 7, 5, FRAME.height)}" fill="#3f94ae"/>
    <path d="${wave(348, 6, 2)}" fill="none" stroke="#e7f6f4" stroke-width="4" opacity="0.7"/>
    <path d="${wave(392, 8, 7)}" fill="none" stroke="#d5f3f6" stroke-width="3" opacity="0.55"/>
    <path d="${wave(438, 5, 4)}" fill="none" stroke="#f7fbf8" stroke-width="2.5" opacity="0.4"/>
  `
  const mist = `
    <ellipse cx="180" cy="196" rx="150" ry="28" fill="#f7fbf8" opacity="0.55"/>
    <ellipse cx="420" cy="208" rx="210" ry="22" fill="#f4faf6" opacity="0.4"/>
    <ellipse cx="700" cy="188" rx="160" ry="20" fill="#fffaf0" opacity="0.35"/>
  `
  const piers = `
    <path d="M268 286 h48 l8 150 h-64 Z" fill="#cbbba6" stroke="#173b3a" stroke-width="2"/>
    <path d="M276 300 h34 v16 h-34 Z" fill="#8d7b68"/>
    <path d="M708 286 h48 l8 150 h-64 Z" fill="#cbbba6" stroke="#173b3a" stroke-width="2"/>
    <path d="M716 300 h34 v16 h-34 Z" fill="#8d7b68"/>
  `
  const shore = `
    <path d="${band(468, 8, 11, FRAME.height)}" fill="#d9c7a4"/>
    <path d="${band(492, 6, 13, FRAME.height)}" fill="#cbb89a"/>
  `
  let pebbles = ''
  const rand = rng(21)
  for (let index = 0; index < 18; index += 1) {
    const x = 40 + rand() * 860
    const y = 500 + rand() * 28
    pebbles += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(6 + rand() * 8).toFixed(1)}" ry="${(3 + rand() * 3).toFixed(1)}" fill="${rand() > 0.5 ? '#8d7b68' : '#efe2cc'}" stroke="#5c3a1a" stroke-width="1"/>`
  }
  let reeds = ''
  for (let index = 0; index < 9; index += 1) {
    const x = 40 + index * 28
    reeds += `<path d="M${x} 470 C ${x + 6} 440 ${x - 4} 420 ${x + 2} 400" fill="none" stroke="#2f5a40" stroke-width="2"/>`
    reeds += `<path d="M${860 - index * 22} 466 C ${868 - index * 22} 438 ${854 - index * 22} 418 ${862 - index * 22} 402" fill="none" stroke="#3f6b4a" stroke-width="2"/>`
  }
  const sun = `<circle cx="780" cy="78" r="46" fill="#fff6df"/><circle cx="780" cy="78" r="70" fill="#fff4d2" opacity="0.35"/>`
  let tufts = ''
  const tuft = rng(18)
  for (let index = 0; index < 28; index += 1) {
    const x = tuft() * 940
    const y = 250 + tuft() * 50
    tufts += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} l6 -16 l6 16 Z" fill="${tuft() > 0.5 ? '#3f6b4a' : '#8fbf78'}"/>`
  }
  const grain = scraps(90, 30, { x: 0, y: 150, w: 960, h: 160 }, '#173b3a', 0.05) + tufts
    + scraps(50, 44, { x: 0, y: 0, w: 960, h: 180 }, '#fffaf0', 0.18)
  return svg(`
    <rect width="${FRAME.width}" height="${FRAME.height}" fill="#f6e4c0"/>
    ${sky}${sun}${mist}${hills}${trees}${grain}
    ${shopShell()}${shopClosed()}
    ${water}${piers}${shore}${pebbles}${reeds}
  `, FRAME.width, FRAME.height)
}

export function shopOpenSvg() {
  return svg(shopOpen(), FRAME.width, FRAME.height)
}

export function shipDockedSvg() {
  return svg(`
    <g transform="translate(214 308)">
      <path d="M8 62 Q90 108 184 62 L164 34 H28 Z" fill="#e7d3b0" stroke="#173b3a" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M20 58 Q90 92 172 58" fill="none" stroke="#c4a27a" stroke-width="4"/>
      <rect x="58" y="8" width="70" height="36" rx="3" fill="#8d4b32" stroke="#173b3a" stroke-width="2"/>
      <rect x="70" y="16" width="18" height="14" fill="#f4e2c2"/>
      <rect x="100" y="16" width="16" height="14" fill="#1d6c84"/>
      <path d="M92 8 V-28" stroke="#6b442c" stroke-width="3"/>
      <path d="M92 -26 L118 -12 L92 -8 Z" fill="#d4534b" stroke="#173b3a" stroke-width="1.2"/>
      <circle cx="36" cy="48" r="7" fill="#f5ecd8" stroke="#5c3a1a"/>
    </g>
  `, FRAME.width, FRAME.height)
}

export function shellLiftedSvg() {
  return svg(`
    <g transform="translate(590 214) scale(1.35)">
      <ellipse cx="36" cy="40" rx="28" ry="8" fill="#173b3a" opacity="0.15"/>
      <path d="M8 36 Q36 4 66 36 Q36 48 8 36 Z" fill="#f2d7b6" stroke="#173b3a" stroke-width="2"/>
      <path d="M20 34 Q36 16 54 34" fill="none" stroke="#8d6b55" stroke-width="2"/>
      <path d="M16 36 Q36 22 58 36" fill="none" stroke="#c4a88a" stroke-width="2"/>
    </g>
  `, FRAME.width, FRAME.height)
}

export function fishHelpedSvg() {
  return svg(`
    <g transform="translate(500 400) scale(1.45)">
      <path d="M8 18 L28 8 L28 28 Z" fill="#d86a32" stroke="#173b3a" stroke-width="1.6"/>
      <ellipse cx="48" cy="18" rx="28" ry="14" fill="#ef8b4c" stroke="#173b3a" stroke-width="2"/>
      <path d="M40 10 Q48 18 40 26" fill="none" stroke="#c45b28" stroke-width="1.5"/>
      <circle cx="62" cy="14" r="2.2" fill="#173b3a"/>
      <path d="M70 18 L86 8 L82 18 L86 28 Z" fill="#e07a3d" stroke="#173b3a" stroke-width="1.4"/>
    </g>
  `, FRAME.width, FRAME.height)
}

export function mapUnfurledSvg() {
  return svg(`
    <g transform="translate(228 158)">
      <rect x="8" y="10" width="16" height="62" rx="6" fill="#8d6b55"/>
      <rect x="92" y="8" width="16" height="66" rx="6" fill="#8d6b55"/>
      <rect x="16" y="6" width="84" height="70" fill="#f7f1df" stroke="#173b3a" stroke-width="2"/>
      <path d="M28 52 C 40 36 52 58 70 40" fill="none" stroke="#1d6c84" stroke-width="3"/>
      <path d="M36 28 H78" stroke="#6ea36a" stroke-width="2"/>
      <circle cx="74" cy="24" r="4" fill="#d4534b"/>
    </g>
  `, FRAME.width, FRAME.height)
}

export function ropeSvg(tight) {
  const d = tight
    ? 'M330 348 C 460 372 620 360 730 348'
    : 'M320 360 C 470 430 640 340 760 390'
  const width = tight ? 11 : 7
  return svg(`
    <path d="${d}" fill="none" stroke="#e7d3b0" stroke-width="${width + 4}" stroke-linecap="round"/>
    <path d="${d}" fill="none" stroke="#f5ecd8" stroke-width="${width}" stroke-linecap="round"/>
    <path d="${d}" fill="none" stroke="#c4a27a" stroke-width="2" stroke-dasharray="9 8" stroke-linecap="round"/>
  `, FRAME.width, FRAME.height)
}

function fox(pose, scarf) {
  const color = SCARF_COLOR[scarf]
  const sit = pose === 'sit'
  const listen = pose === 'listen'
  const reach = pose === 'reach'
  const bodyY = sit ? 138 : 124
  const headY = listen ? 62 : 74
  return `
    <ellipse cx="118" cy="${bodyY + 28}" rx="46" ry="16" fill="#173b3a" opacity="0.12"/>
    <path d="M150 ${bodyY - 10} q28 ${sit ? 20 : 6} 8 30 q-22 -6 -8 -30" fill="#c45b28" stroke="#173b3a" stroke-width="1.6"/>
    <ellipse cx="92" cy="${bodyY}" rx="40" ry="${sit ? 26 : 20}" fill="#e07a3d" stroke="#173b3a" stroke-width="2"/>
    <ellipse cx="78" cy="${bodyY + 6}" rx="22" ry="12" fill="#f6d7b8"/>
    ${reach ? `<ellipse cx="132" cy="${bodyY + 8}" rx="16" ry="8" fill="#e07a3d" stroke="#173b3a" stroke-width="1.5"/>` : ''}
    ${sit ? '' : `<ellipse cx="70" cy="${bodyY + 24}" rx="8" ry="12" fill="#c45b28"/><ellipse cx="108" cy="${bodyY + 24}" rx="8" ry="12" fill="#c45b28"/>`}
    <circle cx="92" cy="${headY}" r="28" fill="#e07a3d" stroke="#173b3a" stroke-width="2"/>
    <path d="M70 ${headY - 16} L76 ${headY - 40} L88 ${headY - 18}" fill="#e07a3d" stroke="#173b3a" stroke-width="1.6"/>
    <path d="M96 ${headY - 18} L104 ${listen ? headY - 46 : headY - 38} L116 ${headY - 14}" fill="#e07a3d" stroke="#173b3a" stroke-width="1.6"/>
    <circle cx="82" cy="${headY - 2}" r="2.4" fill="#173b3a"/>
    <circle cx="104" cy="${headY - 2}" r="2.4" fill="#173b3a"/>
    <ellipse cx="93" cy="${headY + 8}" rx="7" ry="4" fill="#f6d7b8"/>
    <path d="M88 ${headY + 8} q5 3 10 0" fill="none" stroke="#173b3a" stroke-width="1.3"/>
    <path d="M64 ${headY + 20} h56 q6 8 -2 12 H66 q-8 -4 -2 -12" fill="${color}" stroke="#173b3a" stroke-width="1.5"/>
    <circle cx="122" cy="${headY + 30}" r="5" fill="${color}" stroke="#173b3a" stroke-width="1.2"/>
  `
}

function cat(pose) {
  const sitting = pose !== 'arrived'
  const bodyY = sitting ? 132 : 118
  return `
    <ellipse cx="108" cy="${bodyY + 34}" rx="36" ry="12" fill="#173b3a" opacity="0.12"/>
    <path d="M132 ${bodyY} q30 16 8 ${sitting ? 28 : 40}" fill="none" stroke="#a7643e" stroke-width="6" stroke-linecap="round"/>
    <ellipse cx="96" cy="${bodyY}" rx="34" ry="${sitting ? 24 : 18}" fill="#f2c14e" stroke="#173b3a" stroke-width="2"/>
    ${sitting ? `<ellipse cx="78" cy="${bodyY + 16}" rx="12" ry="8" fill="#f2c14e" stroke="#173b3a" stroke-width="1.4"/>` : `<ellipse cx="78" cy="${bodyY + 28}" rx="7" ry="12" fill="#e0ae3a"/><ellipse cx="112" cy="${bodyY + 28}" rx="7" ry="12" fill="#e0ae3a"/>`}
    <circle cx="96" cy="${bodyY - 36}" r="20" fill="#f2c14e" stroke="#173b3a" stroke-width="2"/>
    <path d="M80 ${bodyY - 48} L84 ${bodyY - 66} L96 ${bodyY - 46}" fill="#f2c14e" stroke="#173b3a" stroke-width="1.5"/>
    <path d="M100 ${bodyY - 46} L110 ${bodyY - 66} L116 ${bodyY - 44}" fill="#f2c14e" stroke="#173b3a" stroke-width="1.5"/>
    <circle cx="88" cy="${bodyY - 38}" r="2.4" fill="#173b3a"/>
    <circle cx="106" cy="${bodyY - 38}" r="2.4" fill="#173b3a"/>
    <path d="M90 ${bodyY - 30} h12" stroke="#a7643e" stroke-width="1.6"/>
    ${pose === 'aboard' ? `<path d="M78 ${bodyY + 4} q16 12 32 0" fill="none" stroke="#a7643e" stroke-width="2"/>` : ''}
  `
}

export function pipCellSvg(pose, scarf) {
  return svg(fox(pose, scarf), PIP_CELL.width, PIP_CELL.height)
}

export function kitCellSvg(pose) {
  return svg(cat(pose), KIT_CELL.width, KIT_CELL.height)
}
