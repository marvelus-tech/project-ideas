export type ScarfColor = 'red' | 'leaf' | 'stone'
export type PhonicsPosition = 'start' | 'end'

export interface PhonicsPrompt {
  id: string
  word: string
  mask: string
  correctTile: string
  tiles: [string, string, string]
  position: PhonicsPosition
  isReview: boolean
  hear: string
  reveal: string
  say: string
  world: string
}

export interface MathPrompt {
  id: string
  expression: string
  voiceLine: string
  left: number
  right: number
  op: '+' | '-'
  correct: number
  tiles: [number, number, number]
  material: string
}

export const SENTENCE = 'The cat sat on a ship.'

export const PHONICS_PROMPTS: PhonicsPrompt[] = [
  {
    id: 'cat',
    word: 'cat',
    mask: '___',
    correctTile: 'c',
    tiles: ['c', 's', 't'],
    position: 'start',
    isReview: true,
    hear: 'Someone brought the map. Listen: cat. Tap the sound at the start of cat.',
    reveal: 'c, a, t, cat.',
    say: 'Tell Pip who brought it: cat.',
    world: 'The cat comes in with the map.',
  },
  {
    id: 'sat',
    word: 'sat',
    mask: '___',
    correctTile: 's',
    tiles: ['s', 'c', 't'],
    position: 'start',
    isReview: true,
    hear: 'The map keeps rolling up. Listen: sat. Tap the sound at the start of sat.',
    reveal: 's, a, t, sat.',
    say: 'Tell what the cat did: sat.',
    world: 'The cat sits on the map, and the map stays open.',
  },
  {
    id: 'ship',
    word: 'ship',
    mask: '__ip',
    correctTile: 'sh',
    tiles: ['sh', 's', 't'],
    position: 'start',
    isReview: false,
    hear: 'The map shows what can carry the plank. Listen: ship. Tap the sound at the start of ship.',
    reveal: 'ship.',
    say: 'Call what Pip needs: ship.',
    world: 'The ship docks with the plank.',
  },
  {
    id: 'shop',
    word: 'shop',
    mask: '__op',
    correctTile: 'sh',
    tiles: ['sh', 's', 'p'],
    position: 'start',
    isReview: false,
    hear: 'Pip asks where the bolts are. Listen: shop. Tap the sound at the start of shop.',
    reveal: 'shop.',
    say: 'Tell Pip where: shop.',
    world: 'The shop opens and the bolt tray slides out.',
  },
  {
    id: 'shell',
    word: 'shell',
    mask: '__ell',
    correctTile: 'sh',
    tiles: ['sh', 's', 'h'],
    position: 'start',
    isReview: false,
    hear: 'Something is covering the last bolt. Listen: shell. Tap the sound at the start of shell.',
    reveal: 'shell.',
    say: 'Tell Pip what to lift: shell.',
    world: 'Pip lifts the shell and finds the bolt.',
  },
  {
    id: 'fish',
    word: 'fish',
    mask: 'fi__',
    correctTile: 'sh',
    tiles: ['sh', 'f', 's'],
    position: 'end',
    isReview: false,
    hear: 'Who pushed the rope back? Listen: fish. Tap the sound at the end of fish.',
    reveal: 'fish.',
    say: 'Tell Pip who helped: fish.',
    world: 'The fish nudges the rope to shore.',
  },
]

export const RETRIEVAL_WORDS = ['ship', 'fish', 'shop', 'shell'] as const
export const RETRIEVAL_ANSWER = 'fish'

export const MATH_PROMPTS: MathPrompt[] = [
  {
    id: 'm1',
    expression: '3 + 2',
    voiceLine: 'Three plus two.',
    left: 3,
    right: 2,
    op: '+',
    correct: 5,
    tiles: [5, 4, 6],
    material: 'anchor pebbles',
  },
  {
    id: 'm2',
    expression: '8 + 2',
    voiceLine: 'Eight plus two.',
    left: 8,
    right: 2,
    op: '+',
    correct: 10,
    tiles: [10, 9, 8],
    material: 'bolts',
  },
  {
    id: 'm3',
    expression: '10 - 3',
    voiceLine: 'Ten minus three.',
    left: 10,
    right: 3,
    op: '-',
    correct: 7,
    tiles: [7, 6, 8],
    material: 'rope loops',
  },
  {
    id: 'm4',
    expression: '5 + 4',
    voiceLine: 'Five plus four.',
    left: 5,
    right: 4,
    op: '+',
    correct: 9,
    tiles: [9, 8, 10],
    material: 'braces',
  },
]

export const PARENT_REPORT_KEY = 'pebble-crossing-parent-report'
export const SCARF_KEY = 'pebble-crossing-scarf'
export const CHILD_NAME_KEY = 'pebble-crossing-child-name'
export const ANTI_CYCLE_PROMPT_ID = 'ship'

export const MOUTH_LINE =
  'Look at my mouth. Teeth close. Lips come forward a little. Quiet air keeps going. The throat stays quiet. Not a vowel after it.'

export const FIRST_MISS_LINE =
  'That signal did not call it. Watch and listen again.'

export function missCoach(phase: 'phonics' | 'math' | 'retrieval', voiceLine = ''): string {
  if (phase === 'math') return `${voiceLine} Count the pieces again.`
  if (phase === 'retrieval') return 'Listen for the word whose quiet sound comes last.'
  return FIRST_MISS_LINE
}