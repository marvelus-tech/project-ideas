export type LandingFloater = {
  id: string
  /** Rest position as fraction of hero box width/height */
  restX: number
  restY: number
  depth: number
  size: number
  driftAmp: number
  driftHz: number
  phase: number
}

/** Arc above the open head, grade 1 literacy and within-10 math */
export const LANDING_FLOATERS: LandingFloater[] = [
  { id: 'cat', restX: 0.08, restY: 0.12, depth: 0.35, size: 92, driftAmp: 10, driftHz: 0.11, phase: 0.2 },
  { id: 'sh', restX: 0.22, restY: 0.04, depth: 0.55, size: 100, driftAmp: 12, driftHz: 0.14, phase: 1.1 },
  { id: 'ship', restX: 0.38, restY: 0.02, depth: 0.75, size: 108, driftAmp: 14, driftHz: 0.12, phase: 2.4 },
  { id: 'sum8', restX: 0.54, restY: 0.04, depth: 0.85, size: 104, driftAmp: 11, driftHz: 0.1, phase: 0.8 },
  { id: 'ten', restX: 0.68, restY: 0.1, depth: 0.6, size: 96, driftAmp: 13, driftHz: 0.15, phase: 3.2 },
  { id: 'sum7', restX: 0.82, restY: 0.16, depth: 0.45, size: 98, driftAmp: 9, driftHz: 0.13, phase: 1.7 },
  { id: 'the', restX: 0.92, restY: 0.28, depth: 0.3, size: 88, driftAmp: 8, driftHz: 0.09, phase: 2.9 },
]