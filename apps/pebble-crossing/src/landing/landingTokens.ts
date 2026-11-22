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

/** Seven grade-1 tokens in a wide shallow arc above the bust (Brainka spacing). */
export const LANDING_FLOATERS: LandingFloater[] = [
  {
    id: 'floater_sh',
    restX: 0.06,
    restY: 0.19,
    depth: 0.42,
    width: 78,
    height: 68,
    driftAmp: 9,
    driftHz: 0.13,
    phase: 0.4,
    restRotate: -22,
    tilt: 2.5,
  },
  {
    id: 'floater_ship',
    restX: 0.19,
    restY: 0.14,
    depth: 0.58,
    width: 76,
    height: 78,
    driftAmp: 11,
    driftHz: 0.11,
    phase: 1.2,
    restRotate: 14,
    tilt: 2,
  },
  {
    id: 'floater_8',
    restX: 0.32,
    restY: 0.125,
    depth: 0.76,
    width: 50,
    height: 65,
    driftAmp: 13,
    driftHz: 0.15,
    phase: 2.1,
    restRotate: -9,
    tilt: 2.5,
  },
  {
    id: 'floater_plus',
    restX: 0.44,
    restY: 0.12,
    depth: 0.82,
    width: 41,
    height: 54,
    driftAmp: 10,
    driftHz: 0.17,
    phase: 0.9,
    restRotate: 6,
    tilt: 2,
  },
  {
    id: 'floater_2',
    restX: 0.56,
    restY: 0.125,
    depth: 0.7,
    width: 50,
    height: 51,
    driftAmp: 11,
    driftHz: 0.12,
    phase: 2.8,
    restRotate: -14,
    tilt: 2.5,
  },
  {
    id: 'floater_cat',
    restX: 0.69,
    restY: 0.14,
    depth: 0.55,
    width: 61,
    height: 54,
    driftAmp: 10,
    driftHz: 0.14,
    phase: 1.8,
    restRotate: 17,
    tilt: 2,
  },
  {
    id: 'floater_sentence',
    restX: 0.9,
    restY: 0.18,
    depth: 0.48,
    width: 150,
    height: 37,
    driftAmp: 8,
    driftHz: 0.1,
    phase: 1.6,
    restRotate: 21,
    tilt: 1.5,
  },
]