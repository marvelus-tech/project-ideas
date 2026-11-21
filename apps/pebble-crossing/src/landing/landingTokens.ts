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
  /** Subtle wobble in degrees */
  tilt: number
}

/** Positions aligned to approved master comp; sprites extracted separately. */
export const LANDING_FLOATERS: LandingFloater[] = [
  { id: 'floater_sh', restX: 0.14, restY: 0.2, depth: 0.45, width: 86, height: 74, driftAmp: 12, driftHz: 0.13, phase: 0.4, tilt: 3 },
  { id: 'floater_ship', restX: 0.28, restY: 0.18, depth: 0.62, width: 84, height: 86, driftAmp: 14, driftHz: 0.11, phase: 1.2, tilt: -2.5 },
  { id: 'floater_8', restX: 0.4, restY: 0.17, depth: 0.78, width: 52, height: 68, driftAmp: 16, driftHz: 0.15, phase: 2.1, tilt: 4 },
  { id: 'floater_plus', restX: 0.48, restY: 0.19, depth: 0.7, width: 42, height: 56, driftAmp: 11, driftHz: 0.17, phase: 0.9, tilt: -3 },
  { id: 'floater_2', restX: 0.56, restY: 0.19, depth: 0.58, width: 52, height: 54, driftAmp: 13, driftHz: 0.12, phase: 2.8, tilt: 2 },
  {
    id: 'floater_sentence',
    restX: 0.72,
    restY: 0.21,
    depth: 0.52,
    width: 176,
    height: 42,
    driftAmp: 10,
    driftHz: 0.1,
    phase: 1.6,
    tilt: -1.5,
  },
]