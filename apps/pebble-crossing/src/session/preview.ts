import { MATH_PROMPTS, PHONICS_PROMPTS } from '../content/level6'
import { atPhonicsChoose, createInitialSession, EMPTY_WORLD } from './level6Machine'
import type { SessionState } from './types'

export function previewSession(scene: string | null): SessionState {
  if (scene === 'mouth') {
    return {
      ...createInitialSession(0),
      phase: 'mouth',
      mouthStep: 0,
      scarf: 'red',
      beatStep: 'hear',
    }
  }
  if (scene === 'ship') {
    return {
      ...atPhonicsChoose(2),
      scarf: 'leaf',
      world: { ...EMPTY_WORLD, kit: 'sitting', map: 'open' },
      planks: [
        { promptId: 'cat', kind: 'bolted' },
        { promptId: 'sat', kind: 'bolted' },
      ],
    }
  }
  if (scene === 'math' || scene === 'sentence') {
    return {
      ...createInitialSession(0),
      phase: scene,
      scarf: 'leaf',
      beatStep: 'speak',
      inputOpen: scene === 'math',
      retrievalKind: 'bolted',
      planks: PHONICS_PROMPTS.map((prompt) => ({ promptId: prompt.id, kind: 'bolted' as const })),
      posts: scene === 'sentence' ? MATH_PROMPTS.map((prompt) => ({ promptId: prompt.id, kind: 'bolted' as const })) : [],
      world: {
        ...EMPTY_WORLD,
        kit: 'sitting',
        map: 'open',
        ship: 'docked',
        shop: 'open',
        shell: 'lifted',
        rope: 'tight',
        fish: 'helped',
      },
    }
  }
  if (scene === 'done') {
    return {
      ...createInitialSession(0),
      phase: 'hard_done',
      scarf: 'red',
      world: {
        kit: 'aboard',
        map: 'open',
        ship: 'docked',
        shop: 'open',
        shell: 'lifted',
        rope: 'tight',
        fish: 'helped',
      },
      planks: PHONICS_PROMPTS.map((prompt) => ({ promptId: prompt.id, kind: 'bolted' as const })),
      posts: MATH_PROMPTS.map((prompt) => ({ promptId: prompt.id, kind: 'bolted' as const })),
      signPractice: true,
      sentenceOutcome: 'mic_off_not_assessed',
    }
  }
  return createInitialSession()
}