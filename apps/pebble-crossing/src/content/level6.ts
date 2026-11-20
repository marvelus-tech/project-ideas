export type ScarfColor = 'red' | 'leaf' | 'stone'

export type PhonicsPosition = 'start' | 'end'

export interface PhonicsPrompt {
  id: string
  word: string
  correctTile: string
  tiles: [string, string, string]
  position: PhonicsPosition
  isReview: boolean
}

export interface MathPrompt {
  id: string
  expression: string
  voiceLine: string
  pebbles: [number, number]
  correct: number
  tiles: [number, number, number]
}

export const SENTENCE = 'The cat sat on a ship.'

export const PHONICS_PROMPTS: PhonicsPrompt[] = [
  {
    id: 'cat',
    word: 'cat',
    correctTile: 'c',
    tiles: ['c', 's', 't'],
    position: 'start',
    isReview: true,
  },
  {
    id: 'sat',
    word: 'sat',
    correctTile: 's',
    tiles: ['s', 'c', 't'],
    position: 'start',
    isReview: true,
  },
  {
    id: 'ship',
    word: 'ship',
    correctTile: 'sh',
    tiles: ['sh', 's', 't'],
    position: 'start',
    isReview: false,
  },
  {
    id: 'shop',
    word: 'shop',
    correctTile: 'sh',
    tiles: ['sh', 's', 'p'],
    position: 'start',
    isReview: false,
  },
  {
    id: 'shell',
    word: 'shell',
    correctTile: 'sh',
    tiles: ['sh', 's', 'h'],
    position: 'start',
    isReview: false,
  },
  {
    id: 'fish',
    word: 'fish',
    correctTile: 'sh',
    tiles: ['sh', 'f', 's'],
    position: 'end',
    isReview: false,
  },
]

export const MATH_PROMPTS: MathPrompt[] = [
  {
    id: 'm1',
    expression: '3 + 2',
    voiceLine: 'Three plus two.',
    pebbles: [3, 2],
    correct: 5,
    tiles: [5, 4, 6],
  },
  {
    id: 'm2',
    expression: '8 + 2',
    voiceLine: 'Eight plus two.',
    pebbles: [8, 2],
    correct: 10,
    tiles: [10, 9, 8],
  },
  {
    id: 'm3',
    expression: '10 - 3',
    voiceLine: 'Ten minus three.',
    pebbles: [10, 3],
    correct: 7,
    tiles: [7, 6, 8],
  },
  {
    id: 'm4',
    expression: '5 + 4',
    voiceLine: 'Five plus four.',
    pebbles: [5, 4],
    correct: 9,
    tiles: [9, 8, 10],
  },
]

export const PARENT_REPORT_KEY = 'pebble-crossing-parent-report'
export const SCARF_KEY = 'pebble-crossing-scarf'
export const CHILD_NAME_KEY = 'pebble-crossing-child-name'

// Re-export for tests
export const ANTI_CYCLE_PROMPT_ID = 'ship'