export type LandingFloater = {
  id: string
  /** Rest position as fraction of hero box width/height (anchor = center) */
  restX: number
  restY: number
  depth: number
  width: number
  height: number
  driftAmp: number
  driftHz: number
  phase: number
  /** Static tilt at rest (Brainka-style arc), degrees */
  restRotate: number
  /** Subtle wobble amplitude in degrees */
  tilt: number
}

/** Seven grade-1 tokens in a shallow arc above the bust (matches Brainka floater spread). */
export const LANDING_FLOATERS: LandingFloater[] = [
  {
    id: 'floater_sh',
    restX: 0.09,
    restY: 0.26,
    depth: 0.42,
    width: 92,
    height: 80,
    driftAmp: 11,
    driftHz: 0.13,
    phase: 0.4,
    restRotate: -22,
    tilt: 2.5,
  },
  {
    id: 'floater_ship',
    restX: 0.21,
    restY: 0.2,
    depth: 0.58,
    width: 90,
    height: 92,
    driftAmp: 13,
    driftHz: 0.11,
    phase: 1.2,
    restRotate: 14,
    tilt: 2,
  },
  {
    id: 'floater_8',
    restX: 0.34,
    restY: 0.16,
    depth: 0.76,
    width: 58,
    height: 76,
    driftAmp: 15,
    driftHz: 0.15,
    phase: 2.1,
    restRotate: -9,
    tilt: 2.5,
  },
  {
    id: 'floater_plus',
    restX: 0.46,
    restY: 0.14,
    depth: 0.82,
    width: 48,
    height: 64,
    driftAmp: 12,
    driftHz: 0.17,
    phase: 0.9,
    restRotate: 6,
    tilt: 2,
  },
  {
    id: 'floater_2',
    restX: 0.58,
    restY: 0.16,
    depth: 0.7,
    width: 58,
    height: 60,
    driftAmp: 13,
    driftHz: 0.12,
    phase: 2.8,
    restRotate: -14,
    tilt: 2.5,
  },
  {
    id: 'floater_cat',
    restX: 0.7,
    restY: 0.2,
    depth: 0.55,
    width: 72,
    height: 64,
    driftAmp: 12,
    driftHz: 0.14,
    phase: 1.8,
    restRotate: 17,
    tilt: 2,
  },
  {
    id: 'floater_sentence',
    restX: 0.86,
    restY: 0.25,
    depth: 0.48,
    width: 184,
    height: 44,
    driftAmp: 10,
    driftHz: 0.1,
    phase: 1.6,
    restRotate: 21,
    tilt: 1.5,
  },
]